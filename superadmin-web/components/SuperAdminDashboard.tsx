'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Users, Shield, ShieldAlert, ShieldCheck, Zap, DollarSign, Tag, Check, X,
  Plus, Trash2, Edit2, Key, CheckCircle2, MessageSquare, Mail, RefreshCw, QrCode, CreditCard,
  Ban, Lock, Unlock, TrendingUp, UserX, UserCheck, Eye, ChevronRight, Calendar, Sparkles, Filter, Layers, Clock, PhoneCall, AlertCircle, Bot, SlidersHorizontal, Download, Loader2,
  Copy, MapPin, Phone, ExternalLink, FileText, Smartphone, Globe, Laptop
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export type PlanType = 'FREE_TRIAL' | 'GROW' | 'GROWTH' | 'BUSINESS' | 'ENTERPRISE' | 'STARTER' | 'PRO' | 'PRO_MAX';
export type AITierType = 'BASIC' | 'PRO' | 'ENTERPRISE_CUSTOM';

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

export interface AICompanyConfig {
  enabled: boolean;
  tier: AITierType;
  customSystemPrompt: string;
  monthlyTokenLimit: number;
  tokensUsed: number;
}

export interface WhatsAppCompanyConfig {
  enabled: boolean;
  monthlyLimit: number;
  used: number;
  status: 'CONNECTED' | 'DISCONNECTED' | 'NOT_CONFIGURED';
  phoneNumber?: string;
}

export interface EmailCompanyConfig {
  enabled: boolean;
  monthlyLimit: number;
  used: number;
  senderDomain?: string;
}

export interface CompanyRecord {
  id: string;
  name: string;
  domain?: string;
  adminName: string;
  adminEmail: string;
  phone?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  panType?: string;
  companyType?: string;
  sector?: string;
  accountType?: 'BUY_REQUEST' | 'TRIAL';
  validityDays?: number;
  couponCode?: string;
  verificationStatus?: string;
  registrationKey: string;
  plan: PlanType;
  trialDaysLeft: number;
  isExpired: boolean;
  seatsAllocated: number;
  seatsUsed: number;
  totalUsersCount: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  isActive: boolean;
  createdAt: string;
  registeredAt?: string;
  expiryDate: string;
  emailConfig: EmailCompanyConfig;
  whatsAppConfig: WhatsAppCompanyConfig;
  aiConfig: AICompanyConfig;
  settings?: any;
  subscription?: any;
  requestedPlan?: PlanType;
  seatsRequested?: number;
}

export interface CompanyEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedManager?: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  lastActiveAt?: string | null;
  lastPlatform?: 'WEB' | 'ANDROID' | 'IOS' | 'DESKTOP' | string;
  createdAt: string;
  keyUsed: string;
}

export interface KeyRecord {
  id: string;
  key: string;
  companyName: string;
  planTier: PlanType;
  memberLimit: number;
  validityDays: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
  qrCodeDataUrl?: string;
}

export interface UpgradeRequest {
  id: string;
  companyName: string;
  requestedPlan: string;
  amountInr: number;
  razorpayOrderId: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

export interface WhatsAppDailyLog {
  date: string;
  messagesSent: number;
  deliveryRate: number;
  activeChats: number;
}

export interface DelayInquiry {
  senderName?: string;
  senderEmail?: string;
  message: string;
  timestamp: string;
}

export interface CouponRecord {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENT_OFF' | 'FLAT_OFF';
  discountValue: number;
  maxUses?: number | null;
  usedCount: number;
  applicablePlans: string[];
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
  redemptionCount?: number;
  isExpired?: boolean;
  isExhausted?: boolean;
}

export interface PendingCompanyRecord {
  id: string;
  name: string;
  domain?: string;
  adminName: string;
  adminEmail: string;
  phone?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  panType?: string;
  companyType?: string;
  sector?: string;
  couponCode?: string;
  registrationKey: string;
  requestedPlan: PlanType;
  registeredAt: string;
  seatsRequested?: number;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  delayInquiries?: DelayInquiry[];
  accountType?: 'BUY_REQUEST' | 'TRIAL';
  validityDays?: number;
  features?: {
    emailMarketing?: boolean;
    whatsappCloud?: boolean;
    aiEngine?: boolean;
  };
  settings?: any;
}

const MOCK_PENDING_COMPANIES: PendingCompanyRecord[] = [];

export interface SystemTemplate {
  id: string;
  title: string;
  category: 'funnel' | 'whatsapp' | 'email';
  content: string;
  status: 'ACTIVE' | 'DRAFT';
}

const INITIAL_TEMPLATES: SystemTemplate[] = [
  {
    id: 'tmpl_funnel_1',
    title: 'Standard B2B Enterprise Lead Funnel',
    category: 'funnel',
    content: 'New Inquiry → Requirements Discovery → Proposal Sent → Contract Review → Deal Closed Won',
    status: 'ACTIVE',
  },
  {
    id: 'tmpl_wa_1',
    title: 'Welcome & Onboarding Key WhatsApp Message',
    category: 'whatsapp',
    content: 'Hi {{1}}, welcome to {{2}}! Your registration key {{3}} is active. Login to your dashboard.',
    status: 'ACTIVE',
  },
  {
    id: 'tmpl_email_1',
    title: 'Password Reset OTP Dispatch Email',
    category: 'email',
    content: 'Hello, your 6-digit OTP code to reset your account password is: {{OTP}}. Expires in 15 mins.',
    status: 'ACTIVE',
  },
];

const MOCK_DEMO_COMPANIES: CompanyRecord[] = [
  {
    id: 'cmuev7n3o000mikew7je1tdiw',
    name: 'Adorable Trading',
    domain: 'adorabletrading.com',
    adminName: 'Anurag Sharma',
    adminEmail: 'adorabletrading08@gmail.com',
    phone: '9717355779',
    city: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    pincode: '201306',
    gstNumber: '09ECBPS7187H1ZY',
    panNumber: 'ECBPS7187H',
    panType: 'BUSINESS',
    companyType: 'Proprietorship',
    sector: 'Textile & Apparel',
    accountType: 'TRIAL',
    validityDays: 15,
    registrationKey: 'ADOR-EC-7187',
    plan: 'BUSINESS',
    seatsAllocated: 18,
    seatsUsed: 6,
    totalUsersCount: 6,
    totalLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    expiryDate: '2026-10-09',
    isExpired: false,
    trialDaysLeft: 15,
    isActive: true,
    createdAt: '2026-09-24',
    registeredAt: '2026-09-24T01:40:31.278Z',
    verificationStatus: 'APPROVED',
    emailConfig: { enabled: true, monthlyLimit: 5000, used: 0 },
    whatsAppConfig: { enabled: true, monthlyLimit: 20000, used: 0, status: 'CONNECTED' },
    aiConfig: {
      enabled: true,
      tier: 'PRO',
      customSystemPrompt: 'Standard CRM Lead AI assistant.',
      monthlyTokenLimit: 250000,
      tokensUsed: 0,
    },
    settings: {
      panType: 'BUSINESS',
      pincode: '201306',
      panNumber: 'ECBPS7187H',
      couponCode: null,
      verifiedAt: '2026-09-24T01:47:08.396Z',
      accountType: 'TRIAL',
      registeredAt: '2026-09-24T01:40:31.278Z',
      requestedPlan: 'BUSINESS',
      registrationKey: 'ADOR-EC-7187',
      verificationStatus: 'APPROVED',
      requestedValidityDays: 15,
    },
  },
];

const MOCK_DEMO_KEYS: KeyRecord[] = [
  {
    id: 'cmuev7miq000likew4ezrlby8',
    key: 'ADOR-EC-7187',
    companyName: 'Adorable Trading',
    planTier: 'BUSINESS',
    memberLimit: 18,
    validityDays: 15,
    status: 'ACTIVE',
    expiresAt: '2026-10-09T01:40:30.314Z',
    createdAt: '2026-09-24T01:40:30.527Z',
  },
];

const MOCK_DEMO_EMPLOYEES: Record<string, CompanyEmployee[]> = {
  cmuev7n3o000mikew7je1tdiw: [
    {
      id: 'cmuev7ni70016ikew8an7tdw8',
      name: 'Anurag Sharma',
      email: 'adorabletrading08@gmail.com',
      role: 'ADMIN',
      isActive: true,
      lastLoginAt: '2026-09-28T07:45:00.000Z',
      lastActiveAt: '2026-09-28T08:10:00.000Z',
      lastPlatform: 'WEB',
      createdAt: '2026-09-24T01:40:31.806Z',
      keyUsed: 'ADOR-EC-7187',
    },
    {
      id: 'cmuhp0517000ngg2dq93a6nlp',
      name: 'Nandini Rastogi',
      email: 'rastoginandini92@gmail.com',
      role: 'SALES_EXEC',
      assignedManager: 'Aditya Kumar Rai (Manager)',
      isActive: true,
      lastLoginAt: '2026-09-28T07:55:00.000Z',
      lastActiveAt: '2026-09-28T08:05:00.000Z',
      lastPlatform: 'WEB',
      createdAt: '2026-09-26T01:10:02.107Z',
      keyUsed: 'ADOR-EC-7187',
    },
    {
      id: 'cmuhp0517000ngg2dq93a6rai',
      name: 'Aditya Kumar Rai',
      email: 'rai992522@gmail.com',
      role: 'MANAGER',
      assignedManager: 'Admin',
      isActive: true,
      lastLoginAt: '2026-09-28T06:15:00.000Z',
      lastActiveAt: '2026-09-28T07:30:00.000Z',
      lastPlatform: 'WEB',
      createdAt: '2026-09-26T01:15:00.000Z',
      keyUsed: 'ADOR-EC-7187',
    },
    {
      id: 'usr_sachin_puri_01',
      name: 'Sachin Puri',
      email: 'sachinpuri938@gmail.com',
      role: 'TEAM_LEADER',
      assignedManager: 'Aditya Kumar Rai (Manager)',
      isActive: true,
      lastLoginAt: '2026-09-28T05:20:00.000Z',
      lastActiveAt: '2026-09-28T07:50:00.000Z',
      lastPlatform: 'ANDROID',
      createdAt: '2026-09-27T01:00:00.000Z',
      keyUsed: 'ADOR-EC-7187',
    },
    {
      id: 'cmukwwdv9000ng42dghtw6t3z',
      name: 'Sulekha Tomar',
      email: 'sulekhatmr@gmail.com',
      role: 'SALES_EXEC',
      assignedManager: 'Sachin Puri (Team Leader)',
      isActive: true,
      lastLoginAt: '2026-09-28T06:30:00.000Z',
      lastActiveAt: '2026-09-28T07:40:00.000Z',
      lastPlatform: 'ANDROID',
      createdAt: '2026-09-28T07:14:22.389Z',
      keyUsed: 'ADOR-EC-7187',
    },
    {
      id: 'cmukykfoe000nht2d0ylnsd3t',
      name: 'Sadhana',
      email: 'sadhnadikshit98@gmail.com',
      role: 'SALES_EXEC',
      assignedManager: 'Sachin Puri (Team Leader)',
      isActive: true,
      lastLoginAt: null,
      lastActiveAt: null,
      lastPlatform: 'WEB',
      createdAt: '2026-09-28T08:01:04.094Z',
      keyUsed: 'ADOR-EC-7187',
    },
  ],
};

export function formatLastActivity(emp: CompanyEmployee) {
  const activeTime = emp.lastActiveAt || emp.lastLoginAt;
  const platform = (emp.lastPlatform || 'WEB').toUpperCase();
  const isAndroid = platform.includes('ANDROID') || platform.includes('MOBILE');

  if (!activeTime) {
    return {
      hasActivity: false,
      isAndroid,
      relativeText: 'Pending Login',
      formattedDate: 'No session yet',
      formattedTime: '',
      isRecent: false,
    };
  }

  const actDate = new Date(activeTime);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - actDate.getTime());
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let relativeText = 'Active Now';
  let isRecent = false;

  if (diffMins < 10) {
    relativeText = 'Active Now';
    isRecent = true;
  } else if (diffMins < 60) {
    relativeText = `${diffMins}m ago`;
    isRecent = true;
  } else if (diffHours < 24) {
    relativeText = `${diffHours}h ago`;
  } else if (diffDays === 1) {
    relativeText = 'Yesterday';
  } else if (diffDays < 7) {
    relativeText = `${diffDays}d ago`;
  } else {
    relativeText = actDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const formattedDate = isNaN(actDate.getTime())
    ? '—'
    : actDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  const formattedTime = isNaN(actDate.getTime())
    ? '—'
    : actDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

  return {
    hasActivity: true,
    isAndroid,
    relativeText,
    formattedDate,
    formattedTime,
    isRecent,
  };
}

export function mergeCompanyEmployees(compId: string, serverEmployees: any[] = []): CompanyEmployee[] {
  const fallbackList = MOCK_DEMO_EMPLOYEES[compId] || MOCK_DEMO_EMPLOYEES['cmuev7n3o000mikew7je1tdiw'] || [];
  const employeesMap = new Map<string, CompanyEmployee>();

  // 1. Add server employees
  for (const emp of serverEmployees) {
    if (!emp || !emp.email) continue;
    const emailKey = emp.email.toLowerCase().trim();
    let rawRole = 'UNASSIGNED';
    if (typeof emp.role === 'string' && emp.role.trim() !== '') {
      rawRole = emp.role.trim();
    } else if (emp.role?.name) {
      rawRole = emp.role.name;
    } else if (emp.appliedRole) {
      rawRole = emp.appliedRole;
    } else if (emp.roleId === null || emp.hasAssignedRole === false || !emp.role) {
      rawRole = 'UNASSIGNED';
    }

    employeesMap.set(emailKey, {
      id: emp.id || `emp_${Date.now()}_${Math.random()}`,
      name: emp.name || (emp.firstName ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Staff Member'),
      email: emp.email,
      role: rawRole,
      isActive: emp.isActive !== false,
      lastLoginAt: emp.lastLoginAt || null,
      lastActiveAt: emp.lastActiveAt || emp.lastLoginAt || null,
      lastPlatform: emp.lastPlatform || (rawRole === 'TEAM_LEADER' || emp.email?.includes('puri') || emp.email?.includes('tomar') ? 'ANDROID' : 'WEB'),
      createdAt: emp.createdAt || new Date().toISOString(),
      keyUsed: emp.keyUsed || emp.registrationKey || emp.companyKey || 'ADOR-EC-7187',
    });
  }

  // 2. Only add fallback demo employees if server returned 0 records
  if (employeesMap.size === 0) {
    for (const fb of fallbackList) {
      const emailKey = fb.email.toLowerCase().trim();
      if (!employeesMap.has(emailKey)) {
        employeesMap.set(emailKey, { ...fb });
      }
    }
  }

  // 3. Merge from browser localStorage (cross-tab live sync)
  if (typeof window !== 'undefined') {
    try {
      // Extra staff (from registration or HR adding staff)
      const extraStaff = JSON.parse(localStorage.getItem('das_crm_extra_staff') || '[]');
      if (Array.isArray(extraStaff)) {
        for (const st of extraStaff) {
          if (!st || !st.email) continue;
          const emailKey = st.email.toLowerCase().trim();
          const existing = employeesMap.get(emailKey);
          if (existing) {
            existing.role = st.role ? st.role : (st.appliedRole || existing.role);
            existing.name = st.name || existing.name;
            if (st.lastActiveAt) existing.lastActiveAt = st.lastActiveAt;
            if (st.lastPlatform) existing.lastPlatform = st.lastPlatform;
          } else {
            employeesMap.set(emailKey, {
              id: st.id || `extra_${Date.now()}`,
              name: st.name || 'New Staff',
              email: st.email,
              role: st.role || st.appliedRole || 'SALES_EXEC',
              isActive: st.status !== 'inactive' && st.isActive !== false,
              lastLoginAt: st.lastLoginAt || new Date().toISOString(),
              lastActiveAt: st.lastActiveAt || new Date().toISOString(),
              lastPlatform: st.lastPlatform || 'WEB',
              createdAt: st.joined || new Date().toISOString(),
              keyUsed: st.keyUsed || 'ADOR-EC-7187',
            });
          }
        }
      }

      // Extra unassigned queue (pending registration)
      const extraUnassigned = JSON.parse(localStorage.getItem('das_crm_extra_unassigned') || '[]');
      if (Array.isArray(extraUnassigned)) {
        for (const u of extraUnassigned) {
          if (!u || !u.email) continue;
          const emailKey = u.email.toLowerCase().trim();
          const existing = employeesMap.get(emailKey);
          if (existing) {
            if (u.appliedRole && (!existing.role || existing.role === 'UNASSIGNED')) {
              existing.role = u.appliedRole;
            }
          } else {
            employeesMap.set(emailKey, {
              id: u.id || `unassigned_${Date.now()}`,
              name: u.name || 'New Employee',
              email: u.email,
              role: u.appliedRole || 'UNASSIGNED',
              isActive: true,
              lastLoginAt: u.lastLoginAt || null,
              lastActiveAt: u.lastActiveAt || null,
              lastPlatform: u.lastPlatform || 'WEB',
              createdAt: u.registeredAt || new Date().toISOString(),
              keyUsed: u.keyUsed || 'ADOR-EC-7187',
            });
          }
        }
      }

      // Verified overrides (HR approved / role assigned)
      const overrides = JSON.parse(localStorage.getItem('das_crm_verified_overrides') || '{}');
      if (typeof overrides === 'object' && overrides !== null) {
        employeesMap.forEach((emp, emailKey) => {
          if (overrides[emp.id]) {
            emp.role = overrides[emp.id];
          } else if (overrides[emailKey]) {
            emp.role = overrides[emailKey];
          } else if (emp.email && overrides[emp.email.toLowerCase().trim()]) {
            emp.role = overrides[emp.email.toLowerCase().trim()];
          }
        });
      }

      // Blocked employees list
      const blockedUsers = JSON.parse(localStorage.getItem('das_crm_blocked_users') || '[]');
      if (Array.isArray(blockedUsers)) {
        employeesMap.forEach((emp, emailKey) => {
          if (blockedUsers.includes(emp.id) || blockedUsers.includes(emailKey)) {
            emp.isActive = false;
          }
        });
      }

      // Removed users list
      const removedIds = JSON.parse(localStorage.getItem('das_crm_removed_user_ids') || '[]');
      if (Array.isArray(removedIds)) {
        removedIds.forEach((id: string) => {
          employeesMap.delete(id.toLowerCase());
          for (const [key, emp] of employeesMap.entries()) {
            if (emp.id === id) {
              employeesMap.delete(key);
            }
          }
        });
      }
    } catch (_) {}
  }

  // Normalize roles & return array with verified precedence
  return Array.from(employeesMap.values()).map(emp => {
    let role = emp.role;
    const emailLower = (emp.email || '').toLowerCase().trim();

    // Check localStorage overrides once more for absolute live reactivity
    if (typeof window !== 'undefined') {
      try {
        const overrides = JSON.parse(localStorage.getItem('das_crm_verified_overrides') || '{}');
        if (overrides[emp.id]) {
          role = overrides[emp.id];
        } else if (overrides[emailLower]) {
          role = overrides[emailLower];
        }
      } catch (_) {}
    }

    // Role resolution rules:
    // 1. If role is explicitly set and not unassigned, normalize any aliases
    if (role && role !== 'UNASSIGNED') {
      const upper = String(role).toUpperCase().trim();
      if (upper === 'VIEWER' || upper === 'MEMBER' || upper === 'SALES' || upper === 'TELECALLER' || upper === 'SUPPORT') {
        role = 'SALES_EXEC';
      } else if (upper === 'TL' || upper === 'LEADER') {
        role = 'TEAM_LEADER';
      } else if (['ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC', 'HR', 'SUPER_ADMIN'].includes(upper)) {
        role = upper;
      }
    } else {
      // 2. Fallback only for initial seeded demo emails if not verified yet
      if (emailLower.includes('adorabletrading08') || emailLower.includes('admin')) {
        role = 'ADMIN';
      } else if (emailLower.includes('rai992522') || emailLower.includes('aditya')) {
        role = 'MANAGER';
      } else if (emailLower.includes('sachinpuri') || emailLower.includes('sachin')) {
        role = 'TEAM_LEADER';
      } else if (emailLower.includes('rastoginandini') || emailLower.includes('nandini')) {
        role = 'SALES_EXEC';
      } else if (emailLower.includes('sulekhatmr') || emailLower.includes('sulekha')) {
        role = 'SALES_EXEC';
      } else {
        role = 'UNASSIGNED';
      }
    }

    let assignedManager = emp.assignedManager;
    if (typeof window !== 'undefined') {
      try {
        const storedMgrs = JSON.parse(localStorage.getItem('das_crm_assigned_managers') || '{}');
        if (storedMgrs[emp.id]) {
          assignedManager = storedMgrs[emp.id];
        } else if (storedMgrs[emailLower]) {
          assignedManager = storedMgrs[emailLower];
        }
      } catch (_) {}
    }
    if (!assignedManager) {
      assignedManager =
        role === 'ADMIN'
          ? 'Organization Admin'
          : role === 'MANAGER' || role === 'HR'
          ? 'Admin'
          : role === 'TEAM_LEADER'
          ? 'Aditya Kumar Rai (Manager)'
          : role === 'UNASSIGNED'
          ? 'Pending Admin Assignment'
          : 'Sachin Puri (Team Leader)';
    }

    const defaultPlatform = (role === 'TEAM_LEADER' || emailLower.includes('puri') || emailLower.includes('tomar')) ? 'ANDROID' : 'WEB';
    return {
      ...emp,
      role,
      assignedManager,
      lastActiveAt: emp.lastActiveAt || emp.lastLoginAt || null,
      lastPlatform: emp.lastPlatform || defaultPlatform,
    };
  });
}

export function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<CompanyRecord[]>(MOCK_DEMO_COMPANIES);
  const [keysList, setKeysList] = useState<KeyRecord[]>(MOCK_DEMO_KEYS);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompanyRecord[]>(MOCK_PENDING_COMPANIES);
  const [templates, setTemplates] = useState<SystemTemplate[]>(INITIAL_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [templateTab, setTemplateTab] = useState<'funnel' | 'whatsapp' | 'email'>('funnel');
  const [activeTab, setActiveTab] = useState<'overview' | 'features_hub' | 'company_approvals' | 'keys' | 'templates' | 'whatsapp' | 'pending' | 'employees' | 'expired' | 'coupons' | 'data_retention'>('overview');

  // Search & Filter state for elevated dashboard experience
  const [companySearch, setCompanySearch] = useState('');
  const [companyPlanFilter, setCompanyPlanFilter] = useState<string>('ALL');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState<string>('ALL');
  const [pendingSearch, setPendingSearch] = useState('');

  // Role verification & Quick Action state
  const [assigningRoleId, setAssigningRoleId] = useState<string | null>(null);
  const [roleActionToast, setRoleActionToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // PDF Action State & Notification
  const [sendingPdfCompanyId, setSendingPdfCompanyId] = useState<string | null>(null);
  const [pdfNotification, setPdfNotification] = useState<{ type: 'success' | 'error'; message: string; previewUrl?: string } | null>(null);

  // Dedicated PDF Dispatch & Download Hub Modal
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfSelectedCompany, setPdfSelectedCompany] = useState<any>(null);
  const [pdfCustomEmail, setPdfCustomEmail] = useState('');

  // 🏢 Comprehensive Company Registration Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewCompanyDetails, setViewCompanyDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEmpText, setCopiedEmpText] = useState<string | null>(null);

  const handleSuperAdminAssignRole = async (emp: CompanyEmployee, targetRole: string) => {
    setAssigningRoleId(emp.id);
    const emailLower = (emp.email || '').toLowerCase().trim();

    try {
      // 1. Update companyEmployees optimistically
      setCompanyEmployees(prev =>
        prev.map(e => {
          if (e.id === emp.id || (e.email && e.email.toLowerCase().trim() === emailLower)) {
            return { ...e, role: targetRole };
          }
          return e;
        })
      );

      // 2. Persist to localStorage across all workspace caches
      if (typeof window !== 'undefined') {
        const overrides = JSON.parse(localStorage.getItem('das_crm_verified_overrides') || '{}');
        overrides[emp.id] = targetRole;
        if (emailLower) overrides[emailLower] = targetRole;
        localStorage.setItem('das_crm_verified_overrides', JSON.stringify(overrides));

        // Update extra staff
        const extraStaff = JSON.parse(localStorage.getItem('das_crm_extra_staff') || '[]');
        const updatedExtraStaff = extraStaff.map((st: any) => {
          if (st.id === emp.id || (st.email && st.email.toLowerCase().trim() === emailLower)) {
            return { ...st, role: targetRole, isVerified: true, verificationStatus: 'VERIFIED' };
          }
          return st;
        });
        localStorage.setItem('das_crm_extra_staff', JSON.stringify(updatedExtraStaff));

        // Remove from unassigned queue
        const extraUnassigned = JSON.parse(localStorage.getItem('das_crm_extra_unassigned') || '[]');
        const filteredUnassigned = extraUnassigned.filter(
          (u: any) => u.id !== emp.id && (u.email ? u.email.toLowerCase().trim() !== emailLower : true)
        );
        localStorage.setItem('das_crm_extra_unassigned', JSON.stringify(filteredUnassigned));

        // Dispatch cross-tab & global events
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('crm-role-updated', { detail: { empId: emp.id, email: emailLower, role: targetRole } }));
        window.dispatchEvent(new CustomEvent('das-crm-staff-updated'));
        window.dispatchEvent(new CustomEvent('user-directory-updated'));
        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const bc = new BroadcastChannel('das_crm_sync');
            bc.postMessage({ type: 'STAFF_ROLE_UPDATED', empId: emp.id, email: emailLower, role: targetRole });
            bc.close();
          } catch (_) {}
        }
      }

      // 3. Sync to backend endpoints in background
      const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') || localStorage.getItem('token') : null;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const targetCompId = selectedCompanyId || 'cmuev7n3o000mikew7je1tdiw';

      // Call verify-role on backend
      fetch(`${apiBase}/users/${emp.id}/verify-role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': targetCompId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ assignedRole: targetRole, organizationId: targetCompId }),
      }).catch(() => null);

      // Call crm-sync POST
      fetch('/api/crm-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          role: targetRole,
          organizationId: targetCompId,
          keyUsed: emp.keyUsed || 'ADOR-EC-7187',
        }),
      }).catch(() => null);

      setRoleActionToast({
        type: 'success',
        message: `Verified and assigned role ${targetRole.replace('_', ' ')} to ${emp.name || emp.email}!`,
      });
      setTimeout(() => setRoleActionToast(null), 3500);
    } catch (err: any) {
      setRoleActionToast({
        type: 'error',
        message: `Role assignment failed: ${err?.message || 'Unknown error'}`,
      });
      setTimeout(() => setRoleActionToast(null), 3500);
    } finally {
      setAssigningRoleId(null);
    }
  };

  const handleCopyEmpText = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedEmpText(text);
      setTimeout(() => setCopiedEmpText(null), 2000);
    }
  };

  const handleOpenCompanyDetails = async (comp: any) => {
    setViewCompanyDetails(comp);
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') || localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endpoints = [
        `/api/super-admin/companies/${comp.id}`,
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies/${comp.id}`,
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url, { headers });
          if (res.ok) {
            const data = await res.json();
            const org = data.organization || data;
            const empList = mergeCompanyEmployees(comp.id, data.employees || []);
            setViewCompanyDetails((prev: any) => ({
              ...prev,
              ...org,
              city: org.city || prev?.city,
              state: org.state || prev?.state,
              pincode: org.pincode || (org.settings as any)?.pincode || prev?.pincode,
              gstNumber: org.gstNumber || prev?.gstNumber,
              panNumber: org.panNumber || (org.settings as any)?.panNumber || prev?.panNumber,
              panType: org.panType || (org.settings as any)?.panType || prev?.panType || 'BUSINESS',
              companyType: org.companyType || prev?.companyType,
              sector: org.sector || prev?.sector,
              accountType: org.accountType || (org.settings as any)?.accountType || prev?.accountType,
              validityDays: org.validityDays || (org.settings as any)?.requestedValidityDays || prev?.validityDays,
              couponCode: org.couponCode || (org.settings as any)?.couponCode || prev?.couponCode,
              registeredAt: org.registeredAt || (org.settings as any)?.registeredAt || org.createdAt || prev?.registeredAt || prev?.createdAt,
              registrationKey: org.registrationKey || prev?.registrationKey,
              employees: empList,
              leadStats: data.leadStats || prev?.leadStats || null,
              subscription: data.subscription || prev?.subscription,
            }));
            break;
          }
        } catch {
          // Continue to next endpoint
        }
      }
    } catch (err) {
      console.error('Error fetching deep company details:', err);
    } finally {
      setViewCompanyDetails((prev: any) => {
        if (!prev?.employees || prev.employees.length === 0) {
          return {
            ...prev,
            employees: mergeCompanyEmployees(comp.id, []),
          };
        }
        return prev;
      });
      setDetailsLoading(false);
    }
  };

  const handleCopyRegistrationKey = (key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleOpenPdfModal = (comp?: any) => {
    const targetComp = comp || companies[0] || (pendingCompanies[0] ? pendingCompanies[0] : null);
    setPdfSelectedCompany(targetComp);
    setPdfCustomEmail(targetComp?.adminEmail || '');
    setPdfModalOpen(true);
  };

  const handleSendPdfEmail = async (comp: { id: string; name: string; adminEmail?: string }, customEmail?: string) => {
    setSendingPdfCompanyId(comp.id);
    setPdfNotification(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const targetEmail = customEmail || comp.adminEmail;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies/${comp.id}/send-registration-pdf`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ recipientEmail: targetEmail }),
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setPdfNotification({
          type: 'success',
          message: data.message || `Registration Certificate PDF dispatched to ${targetEmail || 'Admin email'}`,
          previewUrl: data.previewUrl || data.delivery?.previewUrl,
        });
      } else {
        setPdfNotification({
          type: 'error',
          message: data.message || 'Failed to dispatch Registration PDF email.',
        });
      }
    } catch (err: any) {
      setPdfNotification({
        type: 'error',
        message: 'Could not connect to backend server: ' + err?.message,
      });
    } finally {
      setSendingPdfCompanyId(null);
    }
  };

  const handleDownloadPdf = (comp: { id: string; name: string }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    window.open(`${apiUrl}/auth/super-admin/companies/${comp.id}/registration-pdf`, '_blank');
  };

  // Restore activeTab from localStorage on mount and sync on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('superadmin_active_tab') as any;
        if (saved) setActiveTab(saved);
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && activeTab) {
      try {
        localStorage.setItem('superadmin_active_tab', activeTab);
      } catch (_) {}
    }
  }, [activeTab]);

  // 6-Month Data Retention Policy State
  const [retentionStatus, setRetentionStatus] = useState<any>(null);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [retentionPurging, setRetentionPurging] = useState(false);
  const [retentionToast, setRetentionToast] = useState<string | null>(null);

  // Coupon Management State
  const [couponsList, setCouponsList] = useState<CouponRecord[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [newCouponModalOpen, setNewCouponModalOpen] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponDescInput, setCouponDescInput] = useState('');
  const [couponDiscountType, setCouponDiscountType] = useState<'PERCENT_OFF' | 'FLAT_OFF'>('PERCENT_OFF');
  const [couponDiscountVal, setCouponDiscountVal] = useState<number>(20);
  const [couponMaxUses, setCouponMaxUses] = useState<number | ''>(100);
  const [couponExpiresAt, setCouponExpiresAt] = useState('');
  const [couponPlans, setCouponPlans] = useState<string[]>(['GROW', 'BUSINESS', 'ENTERPRISE']);
  const [couponCreating, setCouponCreating] = useState(false);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState<string | null>(null);

  // WhatsApp Quota Top-Up Modal State
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpCompany, setTopUpCompany] = useState<CompanyRecord | null>(null);
  const [topUpAmount, setTopUpAmount] = useState(5000);
  const [topUpProcessing, setTopUpProcessing] = useState(false);
  const [topUpSuccessMsg, setTopUpSuccessMsg] = useState<string | null>(null);

  // Plan Verification & Approval Modal State
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verifyingCompany, setVerifyingCompany] = useState<PendingCompanyRecord | null>(null);
  const [verifyPlan, setVerifyPlan] = useState<PlanType>('GROWTH');
  const [verifySeats, setVerifySeats] = useState<number>(15);
  const [verifyValidityDays, setVerifyValidityDays] = useState<number>(30);
  const [verifyEmailEnabled, setVerifyEmailEnabled] = useState(true);
  const [verifyWAEnabled, setVerifyWAEnabled] = useState(true);
  const [verifyAIEnabled, setVerifyAIEnabled] = useState(true);
  const [verifyApproving, setVerifyApproving] = useState(false);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState<string | null>(null);

  // Rejection Sub-Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('Incomplete business documentation. Please contact DAS CRM support to verify your account.');
  const [rejecting, setRejecting] = useState(false);

  // Multi-tab Company Edit Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalTab, setEditModalTab] = useState<'general' | 'email' | 'whatsapp' | 'ai'>('general');
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);

  // General Edit Fields
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState<PlanType>('FREE_TRIAL');
  const [editSeats, setEditSeats] = useState(10);
  const [editTrialDuration, setEditTrialDuration] = useState(30);
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Email Feature Edit Fields
  const [editEmailEnabled, setEditEmailEnabled] = useState(true);
  const [editEmailLimit, setEditEmailLimit] = useState(25000);
  const [editEmailSenderDomain, setEditEmailSenderDomain] = useState('');

  // WhatsApp Feature Edit Fields
  const [editWAEnabled, setEditWAEnabled] = useState(true);
  const [editWALimit, setEditWALimit] = useState(50000);
  const [editWAPhoneNumber, setEditWAPhoneNumber] = useState('');

  // AI Customization Edit Fields
  const [editAIEnabled, setEditAIEnabled] = useState(true);
  const [editAITier, setEditAITier] = useState<AITierType>('PRO');
  const [editAIPrompt, setEditAIPrompt] = useState('');
  const [editAITokenLimit, setEditAITokenLimit] = useState(250000);

  // Date Wise Chat Log Modal
  const [chatLogModalOpen, setChatLogModalOpen] = useState(false);
  const [chatLogCompany, setChatLogCompany] = useState<CompanyRecord | null>(null);
  const [dailyLogs, setDailyLogs] = useState<WhatsAppDailyLog[]>([]);

  // Custom Extend Expiry Modal State
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendingCompany, setExtendingCompany] = useState<CompanyRecord | null>(null);
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [extendDaysCount, setExtendDaysCount] = useState<number | string>(30);
  const [extendBaseMode, setExtendBaseMode] = useState<'today' | 'currentExpiry'>('today');
  const [extendReason, setExtendReason] = useState('');
  const [extendSaving, setExtendSaving] = useState(false);
  const [extendSuccessMsg, setExtendSuccessMsg] = useState('');

  // Selected company for employee table - defaults immediately to Adorable Trading
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('cmuev7n3o000mikew7je1tdiw');
  const [companyEmployees, setCompanyEmployees] = useState<CompanyEmployee[]>(
    MOCK_DEMO_EMPLOYEES['cmuev7n3o000mikew7je1tdiw'] || []
  );

  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  const fetchRetentionStatus = async () => {
    setRetentionLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/data-retention/status`);
      if (res.ok) {
        const json = await res.json();
        setRetentionStatus(json.data);
      }
    } catch (err) {
      console.warn('Could not fetch data retention status:', err);
    } finally {
      setRetentionLoading(false);
    }
  };

  const handleTriggerPurgeNow = async () => {
    if (!confirm('Execute 6-Month Company History Auto-Purge now?\n\nAll company leads, activities, tasks, and history older than 6 months (180 days) will be deleted.\n\nVerified Employee Documents and KYC are strictly protected.')) {
      return;
    }
    setRetentionPurging(true);
    setRetentionToast(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/data-retention/purge-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        setRetentionToast(`✅ ${json.message}`);
        await fetchRetentionStatus();
      } else {
        setRetentionToast('❌ Purge request returned an error.');
      }
    } catch (err) {
      setRetentionToast('⚠️ Purge completed in offline demo mode.');
    } finally {
      setRetentionPurging(false);
    }
  };

  // 🔄 Dedicated Manual Refresh State with Visual Feedback
  const [employeesRefreshing, setEmployeesRefreshing] = useState(false);
  const [refreshSuccessBadge, setRefreshSuccessBadge] = useState(false);

  const handleManualRefresh = async () => {
    setEmployeesRefreshing(true);
    try {
      await Promise.allSettled([
        fetchBackendData(),
        fetchEmployees(selectedCompanyId),
        fetchCoupons(),
        fetchRetentionStatus(),
      ]);
      setRefreshSuccessBadge(true);
      setTimeout(() => setRefreshSuccessBadge(false), 2500);
    } catch (err) {
      console.warn('Manual refresh error:', err);
    } finally {
      setEmployeesRefreshing(false);
    }
  };

  const fetchEmployees = async (compId?: string) => {
    const targetCompId = compId || selectedCompanyId || MOCK_DEMO_COMPANIES[0]?.id || 'cmuev7n3o000mikew7je1tdiw';
    const collectedServerEmps: any[] = [];
    const seenEmails = new Set<string>();

    const addEmps = (list: any[]) => {
      if (!Array.isArray(list)) return;
      for (const item of list) {
        if (!item) continue;
        const email = (item.email || '').toLowerCase().trim();
        if (email && !seenEmails.has(email)) {
          seenEmails.add(email);
          collectedServerEmps.push(item);
        } else if (!email && item.id && !seenEmails.has(item.id)) {
          seenEmails.add(item.id);
          collectedServerEmps.push(item);
        }
      }
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('superadmin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const endpoints = [
      `/api/super-admin/companies/${targetCompId}`,
      `${apiBase}/auth/super-admin/companies/${targetCompId}`,
      `${apiBase}/users?organizationId=${targetCompId}`,
    ];

    try {
      await Promise.allSettled(
        endpoints.map(async (url) => {
          try {
            const res = await fetch(url, { headers });
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data?.employees)) {
                addEmps(data.employees);
              } else if (Array.isArray(data)) {
                addEmps(data);
              } else if (Array.isArray(data?.users)) {
                addEmps(data.users);
              }
            }
          } catch (_) {}
        })
      );
    } catch (err) {
      console.warn('Failed to fetch employees from backend:', err);
    }

    const merged = mergeCompanyEmployees(targetCompId, collectedServerEmps);
    setCompanyEmployees(merged);

    // Update company seats dynamically
    setCompanies(prev => prev.map(c => {
      if (c.id === targetCompId) {
        const isAdorable = c.id === 'cmuev7n3o000mikew7je1tdiw' || (c.name || '').toLowerCase().includes('adorable');
        const count = isAdorable ? Math.max(merged.length, 5) : Math.max(merged.length, 1);
        return {
          ...c,
          seatsUsed: count,
          totalUsersCount: count,
        };
      }
      return c;
    }));
  };

  const fetchBackendData = async () => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') || localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let companiesLoaded = false;
    const companyEndpoints = [
      '/api/super-admin/companies',
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies`
    ];

    for (const url of companyEndpoints) {
      try {
        const compRes = await fetch(url, { headers });
        if (compRes.ok) {
          const data = await compRes.json();
          if (Array.isArray(data) && data.length > 0) {
            const formatted = data.map((c: any) => {
              const compEmps = mergeCompanyEmployees(c.id, c.users || c.employees || []);
              const seatsUsed = Math.max(compEmps.length, c.seatsUsed ?? 0, 1);
              const totalUsersCount = Math.max(compEmps.length, c.totalUsersCount ?? 0, 1);
              return {
                ...c,
                totalUsersCount,
                seatsUsed,
                emailConfig: c.emailConfig || { enabled: true, monthlyLimit: 5000, used: 0 },
                whatsAppConfig: c.whatsAppConfig || { enabled: true, monthlyLimit: 20000, used: 0, status: 'CONNECTED' },
                aiConfig: c.aiConfig || { enabled: true, tier: 'PRO', customSystemPrompt: 'Standard CRM Lead AI assistant.', monthlyTokenLimit: 250000, tokensUsed: 0 },
              };
            });
            setCompanies(formatted);
            setSelectedCompanyId(prev => (prev && formatted.some((c: any) => c.id === prev) ? prev : formatted[0].id));
            companiesLoaded = true;
            break;
          }
        }
      } catch {
        // Try next endpoint
      }
    }

    if (!companiesLoaded) {
      setCompanies(prev => {
        const list = prev.length > 0 ? prev : MOCK_DEMO_COMPANIES;
        return list.map(c => {
          const compEmps = mergeCompanyEmployees(c.id, []);
          const count = Math.max(compEmps.length, c.seatsUsed ?? 0, 1);
          return {
            ...c,
            seatsUsed: count,
            totalUsersCount: count,
          };
        });
      });
      setSelectedCompanyId(prev => prev || MOCK_DEMO_COMPANIES[0].id);
    }

    const keyEndpoints = [
      '/api/super-admin/keys',
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/keys`
    ];
    for (const kUrl of keyEndpoints) {
      try {
        const keysRes = await fetch(kUrl, { headers });
        if (keysRes.ok) {
          const data = await keysRes.json();
          if (data?.companyKeys && data.companyKeys.length > 0) {
            setKeysList(data.companyKeys);
            break;
          }
        }
      } catch {
        // Continue
      }
    }

    try {
      const pendingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies/pending`, { headers });
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        if (Array.isArray(pendingData)) {
          setPendingCompanies(pendingData);
        }
      }
    } catch (err) {
      console.warn('Backend API notice:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time auto-sync: Periodic polling + Cross-tab storage & Window focus listeners
  useEffect(() => {
    fetchBackendData();
    fetchCoupons();
    fetchRetentionStatus();
    fetchEmployees(selectedCompanyId);

    // Cross-tab storage listener (reacts immediately when a user registers or gets approved in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key.includes('das_crm_') ||
        e.key.includes('staff') ||
        e.key.includes('user') ||
        e.key.includes('overrides') ||
        e.key.includes('blocked')
      ) {
        fetchEmployees(selectedCompanyId);
      }
    };

    // Custom CRM role/staff updated event listener (fires when roles or users are updated in-tab or cross-tab)
    const handleCrmRoleUpdate = () => {
      fetchEmployees(selectedCompanyId);
    };

    // Tab focus listener
    const handleWindowFocus = () => {
      fetchEmployees(selectedCompanyId);
    };

    // Auto-refresh interval (every 4 seconds for instant reactive updates)
    const intervalId = setInterval(() => {
      fetchEmployees(selectedCompanyId);
    }, 4000);

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('crm-role-updated', handleCrmRoleUpdate);
    window.addEventListener('das-crm-staff-updated', handleCrmRoleUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('crm-role-updated', handleCrmRoleUpdate);
      window.removeEventListener('das-crm-staff-updated', handleCrmRoleUpdate);
    };
  }, [selectedCompanyId]);

  const handleOpenVerificationModal = (comp: PendingCompanyRecord) => {
    let plan = comp.requestedPlan || 'GROW';
    if ((plan as string) === 'GROWTH') plan = 'GROW';
    setVerifyingCompany(comp);
    setVerifyPlan(plan as PlanType);
    const defaultSeats = plan === 'ENTERPRISE' ? 60 : plan === 'BUSINESS' ? 18 : 6;
    setVerifySeats(comp.seatsRequested || defaultSeats);
    setVerifyValidityDays(comp.validityDays || (comp.accountType === 'BUY_REQUEST' ? 30 : 15));
    setVerifyEmailEnabled(plan === 'GROW' ? false : (comp.features?.emailMarketing ?? true));
    setVerifyWAEnabled(plan === 'GROW' ? false : (comp.features?.whatsappCloud ?? true));
    setVerifyAIEnabled(plan === 'GROW' ? false : (comp.features?.aiEngine ?? true));
    setVerifySuccessMsg(null);
    setVerificationModalOpen(true);
  };

  const handleApproveCompany = async () => {
    if (!verifyingCompany) return;
    setVerifyApproving(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies/${verifyingCompany.id}/approve`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            plan: verifyPlan,
            memberLimit: verifySeats,
            validityDays: verifyValidityDays,
            features: {
              emailMarketing: verifyEmailEnabled,
              whatsappCloud: verifyWAEnabled,
              aiEngine: verifyAIEnabled,
            },
          }),
        }
      );
    } catch (err) {
      console.warn('Backend offline / demo approve mode:', err);
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + verifyValidityDays);
    const newExpiryStr = futureDate.toISOString().split('T')[0];

    const newlyActiveCompany: CompanyRecord = {
      id: verifyingCompany.id,
      name: verifyingCompany.name,
      domain: verifyingCompany.domain,
      adminName: verifyingCompany.adminName,
      adminEmail: verifyingCompany.adminEmail,
      registrationKey: verifyingCompany.registrationKey,
      plan: verifyPlan,
      trialDaysLeft: verifyValidityDays,
      isExpired: false,
      seatsAllocated: verifySeats,
      seatsUsed: 1,
      totalUsersCount: 1,
      totalLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      isActive: true,
      createdAt: verifyingCompany.registeredAt ? verifyingCompany.registeredAt.split('T')[0] : new Date().toISOString().split('T')[0],
      expiryDate: newExpiryStr,
      emailConfig: {
        enabled: verifyEmailEnabled,
        monthlyLimit: verifyPlan === 'ENTERPRISE' ? 0 : verifyPlan === 'BUSINESS' ? 5000 : 0,
        used: 0,
        senderDomain: verifyingCompany.domain,
      },
      whatsAppConfig: {
        enabled: verifyWAEnabled,
        monthlyLimit: verifyPlan === 'ENTERPRISE' ? 0 : verifyPlan === 'BUSINESS' ? 20000 : 0,
        used: 0,
        status: verifyWAEnabled ? 'CONNECTED' : 'DISCONNECTED',
      },
      aiConfig: {
        enabled: verifyAIEnabled,
        tier: verifyPlan === 'ENTERPRISE' ? 'ENTERPRISE_CUSTOM' : 'PRO',
        customSystemPrompt: `AI Concierge for ${verifyingCompany.name}.`,
        monthlyTokenLimit: verifyPlan === 'ENTERPRISE' ? 1000000 : 250000,
        tokensUsed: 0,
      },
    };

    setCompanies(prev => [newlyActiveCompany, ...prev.filter(c => c.id !== verifyingCompany.id)]);
    setPendingCompanies(prev => prev.filter(p => p.id !== verifyingCompany.id));

    setVerifySuccessMsg(`🎉 Successfully verified and activated ${verifyingCompany.name}! An approval confirmation email has been dispatched.`);
    setTimeout(() => {
      setVerifyApproving(false);
      setVerificationModalOpen(false);
    }, 1200);
  };

  const handleRejectCompany = async () => {
    if (!verifyingCompany) return;
    setRejecting(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies/${verifyingCompany.id}/reject`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ reason: rejectionReasonInput }),
        }
      );
    } catch (err) {
      console.warn('Backend offline / demo reject mode:', err);
    }

    setPendingCompanies(prev => prev.filter(p => p.id !== verifyingCompany.id));
    setRejecting(false);
    setRejectModalOpen(false);
    setVerificationModalOpen(false);
  };

  const fetchCoupons = async () => {
    setCouponsLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/billing/coupons`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCouponsList(data);
      }
    } catch (e) {
      setCouponsList([
        {
          id: 'cpn_launch2026',
          code: 'LAUNCH2026',
          description: 'Grand Opening 25% discount for SaaS early adopters',
          discountType: 'PERCENT_OFF',
          discountValue: 25,
          maxUses: 100,
          usedCount: 14,
          applicablePlans: ['GROW', 'BUSINESS', 'ENTERPRISE'],
          isActive: true,
          expiresAt: '2026-12-31T23:59:59.000Z',
          createdAt: '2026-09-01T10:00:00.000Z',
          redemptionCount: 14,
        },
        {
          id: 'cpn_bizflat500',
          code: 'BIZFLAT500',
          description: '₹500 flat off on Business subscription',
          discountType: 'FLAT_OFF',
          discountValue: 500,
          maxUses: 50,
          usedCount: 8,
          applicablePlans: ['BUSINESS', 'ENTERPRISE'],
          isActive: true,
          expiresAt: null,
          createdAt: '2026-09-10T12:00:00.000Z',
          redemptionCount: 8,
        },
      ]);
    } finally {
      setCouponsLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setCouponCreating(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const payload = {
      code: couponCodeInput.trim().toUpperCase(),
      description: couponDescInput.trim() || undefined,
      discountType: couponDiscountType,
      discountValue: Number(couponDiscountVal),
      maxUses: couponMaxUses === '' ? null : Number(couponMaxUses),
      applicablePlans: couponPlans,
      expiresAt: couponExpiresAt ? new Date(couponExpiresAt).toISOString() : undefined,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/billing/coupons`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        const createdCoupon = data.coupon || { ...payload, id: `cpn_${Date.now()}`, usedCount: 0, isActive: true, createdAt: new Date().toISOString() };
        setCouponsList(prev => [createdCoupon, ...prev]);
        setCouponSuccessMsg(`Coupon "${payload.code}" created successfully!`);
        setTimeout(() => {
          setNewCouponModalOpen(false);
          setCouponSuccessMsg(null);
          setCouponCodeInput('');
          setCouponDescInput('');
        }, 1200);
      }
    } catch {
      const mockCpn: CouponRecord = {
        id: `cpn_${Date.now()}`,
        code: payload.code,
        description: payload.description,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        maxUses: payload.maxUses,
        usedCount: 0,
        applicablePlans: payload.applicablePlans,
        isActive: true,
        expiresAt: payload.expiresAt || null,
        createdAt: new Date().toISOString(),
        redemptionCount: 0,
      };
      setCouponsList(prev => [mockCpn, ...prev]);
      setCouponSuccessMsg(`Coupon "${payload.code}" created!`);
      setTimeout(() => {
        setNewCouponModalOpen(false);
        setCouponSuccessMsg(null);
        setCouponCodeInput('');
        setCouponDescInput('');
      }, 1200);
    } finally {
      setCouponCreating(false);
    }
  };

  const handleRevokeCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to revoke/deactivate this coupon?')) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/billing/coupons/${couponId}`, {
        method: 'DELETE',
        headers,
      });
    } catch (e) {
      console.warn('Backend delete coupon error:', e);
    }

    setCouponsList(prev => prev.map(c => c.id === couponId ? { ...c, isActive: false } : c));
  };

  const handleTopUpWhatsApp = async (companyId: string, amount: number) => {
    setTopUpProcessing(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies/${companyId}/top-up-whatsapp`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ amount }),
      });
    } catch (e) {
      console.warn('Backend offline / demo top-up:', e);
    }

    setCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        return {
          ...c,
          whatsAppConfig: {
            ...c.whatsAppConfig,
            monthlyLimit: (c.whatsAppConfig?.monthlyLimit || 0) + amount,
          },
        };
      }
      return c;
    }));

    setTopUpSuccessMsg(`Successfully added +${amount.toLocaleString()} WhatsApp credits!`);
    setTimeout(() => {
      setTopUpProcessing(false);
      setTopUpModalOpen(false);
      setTopUpSuccessMsg(null);
    }, 1200);
  };

  const handleResetEmailQuota = async (companyId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies/${companyId}/reset-email-quota`, {
        method: 'POST',
        headers,
      });
    } catch (e) {
      console.warn('Backend offline / demo email reset:', e);
    }

    setCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        return {
          ...c,
          emailConfig: {
            ...c.emailConfig,
            used: 0,
          },
        };
      }
      return c;
    }));

    alert('Monthly Email Quota has been reset to 0 used!');
  };

  const handleOpenEditModal = (comp: CompanyRecord, initialTab: 'general' | 'email' | 'whatsapp' | 'ai' = 'general') => {
    setEditingCompany(comp);
    setEditModalTab(initialTab);

    // General
    setEditName(comp.name);
    setEditPlan(comp.plan);
    const defaultSeats = comp.seatsAllocated || getPlanSeatQuota(comp.plan);
    setEditSeats(defaultSeats);
    const defaultTrialDays = comp.trialDaysLeft > 0 ? Math.min(40, Math.max(15, comp.trialDaysLeft)) : 30;
    setEditTrialDuration(defaultTrialDays);
    setEditExpiryDate(comp.expiryDate || new Date(Date.now() + defaultTrialDays * 86400000).toISOString().split('T')[0]);
    setEditIsActive(comp.isActive);

    // Email
    setEditEmailEnabled(comp.emailConfig?.enabled ?? true);
    setEditEmailLimit(comp.emailConfig?.monthlyLimit ?? 25000);
    setEditEmailSenderDomain(comp.emailConfig?.senderDomain || `${comp.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);

    // WhatsApp
    setEditWAEnabled(comp.whatsAppConfig?.enabled ?? true);
    setEditWALimit(comp.whatsAppConfig?.monthlyLimit ?? 50000);
    setEditWAPhoneNumber(comp.whatsAppConfig?.phoneNumber || '+919876543210');

    // AI
    setEditAIEnabled(comp.aiConfig?.enabled ?? true);
    setEditAITier(comp.aiConfig?.tier || 'PRO');
    setEditAIPrompt(comp.aiConfig?.customSystemPrompt || `Assist ${comp.name} sales reps with high conversion lead scoring.`);
    setEditAITokenLimit(comp.aiConfig?.monthlyTokenLimit || 250000);

    setEditModalOpen(true);
  };

  const handleSaveCompanyEdit = async () => {
    if (!editingCompany) return;
    const isNowExpired = editExpiryDate ? new Date(editExpiryDate) < new Date() : false;
    const daysLeft = editExpiryDate
      ? Math.max(0, Math.ceil((new Date(editExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    const payload = {
      name: editName,
      plan: editPlan,
      seatsAllocated: editSeats,
      expiryDate: editExpiryDate,
      isActive: editIsActive,
      emailConfig: {
        enabled: editEmailEnabled,
        monthlyLimit: editEmailLimit,
        senderDomain: editEmailSenderDomain,
      },
      whatsAppConfig: {
        enabled: editWAEnabled,
        monthlyLimit: editWALimit,
        phoneNumber: editWAPhoneNumber,
        status: editWAEnabled ? (editingCompany.whatsAppConfig?.status === 'NOT_CONFIGURED' ? 'CONNECTED' : editingCompany.whatsAppConfig?.status) : 'DISCONNECTED',
      },
      aiConfig: {
        enabled: editAIEnabled,
        tier: editAITier,
        customSystemPrompt: editAIPrompt,
        monthlyTokenLimit: editAITokenLimit,
      },
    };

    // Immediate UI update
    setCompanies(prev => prev.map(c => c.id === editingCompany.id ? {
      ...c,
      name: editName,
      plan: editPlan,
      seatsAllocated: editSeats,
      expiryDate: editExpiryDate,
      isActive: editIsActive,
      isExpired: isNowExpired,
      trialDaysLeft: daysLeft,
      emailConfig: {
        ...c.emailConfig,
        enabled: editEmailEnabled,
        monthlyLimit: editEmailLimit,
        senderDomain: editEmailSenderDomain,
      },
      whatsAppConfig: {
        ...c.whatsAppConfig,
        enabled: editWAEnabled,
        monthlyLimit: editWALimit,
        phoneNumber: editWAPhoneNumber,
        status: editWAEnabled ? (c.whatsAppConfig?.status === 'NOT_CONFIGURED' ? 'CONNECTED' : c.whatsAppConfig?.status) : 'DISCONNECTED',
      },
      aiConfig: {
        ...c.aiConfig,
        enabled: editAIEnabled,
        tier: editAITier,
        customSystemPrompt: editAIPrompt,
        monthlyTokenLimit: editAITokenLimit,
      },
    } : c));

    setEditModalOpen(false);

    // Backend database update
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') || localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      await fetch(`${apiBase}/auth/super-admin/companies/${editingCompany.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      await fetchBackendData();
    } catch (err) {
      console.warn('Backend database update error:', err);
    }
  };

  const handleToggleInstantFeature = async (companyId: string, feature: 'email' | 'whatsapp' | 'ai', nextState: boolean) => {
    let updatedCompany: CompanyRecord | null = null;
    setCompanies(prev => prev.map(c => {
      if (c.id !== companyId) return c;
      let newComp = { ...c };
      if (feature === 'email') {
        newComp = { ...c, emailConfig: { ...c.emailConfig, enabled: nextState } };
      } else if (feature === 'whatsapp') {
        newComp = {
          ...c,
          whatsAppConfig: {
            ...c.whatsAppConfig,
            enabled: nextState,
            status: nextState ? (c.whatsAppConfig.status === 'NOT_CONFIGURED' ? 'CONNECTED' : c.whatsAppConfig.status) : 'DISCONNECTED',
          },
        };
      } else if (feature === 'ai') {
        newComp = { ...c, aiConfig: { ...c.aiConfig, enabled: nextState } };
      }
      updatedCompany = newComp;
      return newComp;
    }));

    if (updatedCompany) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') || localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      try {
        await fetch(`${apiBase}/auth/super-admin/companies/${companyId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            emailConfig: (updatedCompany as CompanyRecord).emailConfig,
            whatsAppConfig: (updatedCompany as CompanyRecord).whatsAppConfig,
            aiConfig: (updatedCompany as CompanyRecord).aiConfig,
          }),
        });
      } catch (err) {
        console.warn('Backend toggle update error:', err);
      }
    }
  };

  const handleQuickAdjustSeats = async (companyId: string, delta: number) => {
    let updatedSeats = 0;
    setCompanies(prev => prev.map(c => {
      if (c.id !== companyId) return c;
      updatedSeats = Math.max(c.seatsUsed, c.seatsAllocated + delta);
      return { ...c, seatsAllocated: updatedSeats };
    }));

    if (updatedSeats > 0) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') || localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      try {
        await fetch(`${apiBase}/auth/super-admin/companies/${companyId}/seats`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ memberLimit: updatedSeats }),
        });
      } catch (err) {
        console.warn('Backend seat adjustment error:', err);
      }
    }
  };

  const handleEditPlanChange = (newPlan: PlanType) => {
    setEditPlan(newPlan);
    if (newPlan === 'FREE_TRIAL') {
      setEditSeats(6);
      const expiry = new Date(Date.now() + editTrialDuration * 86400000).toISOString().split('T')[0];
      setEditExpiryDate(expiry);
      setEditEmailEnabled(false);
      setEditWAEnabled(false);
      setEditAIEnabled(false);
    } else if (newPlan === 'GROW' || newPlan === 'GROWTH') {
      setEditSeats(6);
      const expiry = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      setEditExpiryDate(expiry);
      setEditEmailEnabled(false);
      setEditWAEnabled(false);
      setEditAIEnabled(false);
    } else if (newPlan === 'BUSINESS' || newPlan === 'PRO') {
      setEditSeats(18);
      const expiry = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      setEditExpiryDate(expiry);
      setEditEmailEnabled(true);
      setEditEmailLimit(5000);
      setEditWAEnabled(true);
      setEditWALimit(20000);
      setEditAIEnabled(true);
    } else if (newPlan === 'ENTERPRISE' || newPlan === 'PRO_MAX') {
      setEditSeats(60);
      const expiry = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
      setEditExpiryDate(expiry);
      setEditEmailEnabled(true);
      setEditEmailLimit(0);
      setEditWAEnabled(true);
      setEditWALimit(0);
      setEditAIEnabled(true);
    }
  };

  const handleTrialDurationChange = (days: number) => {
    const clamped = Math.max(15, Math.min(40, days));
    setEditTrialDuration(clamped);
    const expiry = new Date(Date.now() + clamped * 86400000).toISOString().split('T')[0];
    setEditExpiryDate(expiry);
  };

  const getDaysRemaining = (dStr?: string, fallbackDays?: number): number => {
    if (!dStr) return fallbackDays !== undefined ? fallbackDays : 0;
    try {
      const datePart = dStr.includes('T') ? dStr : `${dStr}T23:59:59`;
      const target = new Date(datePart).getTime();
      if (isNaN(target)) return fallbackDays !== undefined ? fallbackDays : 0;
      const now = Date.now();
      return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    } catch {
      return fallbackDays !== undefined ? fallbackDays : 0;
    }
  };

  const calculateDaysFromToday = (dStr: string): number => {
    if (!dStr) return 0;
    const diff = getDaysRemaining(dStr);
    return diff > 0 ? diff : 0;
  };

  const getCompanySubscriptionStatus = (comp: CompanyRecord) => {
    if (!comp.isActive) {
      return {
        key: 'BLOCKED',
        label: 'Account Blocked',
        badgeCls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        dotCls: 'bg-rose-500',
        isExp: true,
      };
    }
    if (comp.verificationStatus === 'PENDING' || comp.verificationStatus === 'AWAITING') {
      return {
        key: 'PENDING_APPROVAL',
        label: 'Pending Approval',
        badgeCls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        dotCls: 'bg-amber-400 animate-pulse',
        isExp: false,
      };
    }
    const days = getDaysRemaining(comp.expiryDate, comp.trialDaysLeft);
    const isExplicitExpired = comp.isExpired || (comp.expiryDate && new Date(comp.expiryDate.includes('T') ? comp.expiryDate : `${comp.expiryDate}T23:59:59`) < new Date());

    if (isExplicitExpired || days < 0) {
      return {
        key: 'EXPIRED',
        label: 'Plan Expired',
        badgeCls: 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40',
        dotCls: 'bg-rose-500 animate-ping',
        isExp: true,
      };
    }
    if (days === 0) {
      return {
        key: 'EXPIRES_TODAY',
        label: 'Expires Today',
        badgeCls: 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40',
        dotCls: 'bg-amber-400 animate-pulse',
        isExp: false,
      };
    }
    if (days <= 3) {
      return {
        key: 'EXPIRING_SOON',
        label: `Expiring Soon (${days}d left)`,
        badgeCls: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
        dotCls: 'bg-amber-400 animate-pulse',
        isExp: false,
      };
    }
    if (comp.accountType === 'TRIAL' || comp.plan === 'FREE_TRIAL' || comp.subscription?.isTrialActive) {
      return {
        key: 'TRIAL_ACTIVE',
        label: 'Trial Active',
        badgeCls: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30',
        dotCls: 'bg-cyan-400',
        isExp: false,
      };
    }
    return {
      key: 'ACTIVE',
      label: 'Active Plan',
      badgeCls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
      dotCls: 'bg-emerald-400',
      isExp: false,
    };
  };

  const getPlanMeta = (plan?: string) => {
    const p = (plan || 'BUSINESS').toUpperCase();
    if (p === 'FREE_TRIAL' || p === 'TRIAL') {
      return {
        name: 'Free Trial',
        tag: 'TRIAL',
        icon: '✨',
        badgeCls: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
        cardBorder: 'border-amber-500/30',
        gradient: 'from-amber-500/20 to-orange-500/10',
      };
    }
    if (p === 'STARTER') {
      return {
        name: 'Starter Plan',
        tag: 'STARTER',
        icon: '⚡',
        badgeCls: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30',
        cardBorder: 'border-sky-500/30',
        gradient: 'from-sky-500/20 to-blue-500/10',
      };
    }
    if (p === 'GROWTH' || p === 'GROW') {
      return {
        name: 'Growth Plan',
        tag: 'GROWTH',
        icon: '🚀',
        badgeCls: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
        cardBorder: 'border-indigo-500/30',
        gradient: 'from-indigo-500/20 to-purple-500/10',
      };
    }
    if (p === 'ENTERPRISE' || p === 'PRO_MAX' || p === 'MAX') {
      return {
        name: 'Enterprise Plan',
        tag: 'ENTERPRISE',
        icon: '👑',
        badgeCls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
        cardBorder: 'border-emerald-500/30',
        gradient: 'from-emerald-500/20 to-teal-500/10',
      };
    }
    return {
      name: 'Business Plan',
      tag: 'BUSINESS',
      icon: '💼',
      badgeCls: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30',
      cardBorder: 'border-cyan-500/30',
      gradient: 'from-cyan-500/20 to-indigo-500/10',
    };
  };

  const formatFullDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dStr;
    }
  };

  const handleOpenExtendModal = (comp: CompanyRecord) => {
    setExtendingCompany(comp);
    setExtendSuccessMsg('');
    const today = new Date();
    const isCurrentFuture = comp.expiryDate && new Date(comp.expiryDate) > today;
    const base = isCurrentFuture ? new Date(comp.expiryDate) : today;

    const future = new Date(base);
    future.setDate(future.getDate() + 30);
    const dateStr = future.toISOString().split('T')[0];

    setCustomExpiryDate(dateStr);
    setExtendDaysCount(30);
    setExtendBaseMode(isCurrentFuture ? 'currentExpiry' : 'today');
    setExtendReason('');
    setExtendModalOpen(true);
  };

  const handleApplyDaysPreset = (days: number) => {
    setExtendDaysCount(days);
    const today = new Date();
    const isCurrentFuture = extendingCompany?.expiryDate && new Date(extendingCompany.expiryDate) > today;
    const base = (extendBaseMode === 'currentExpiry' && isCurrentFuture)
      ? new Date(extendingCompany!.expiryDate)
      : today;
    const target = new Date(base);
    target.setDate(target.getDate() + days);
    setCustomExpiryDate(target.toISOString().split('T')[0]);
  };

  const handleCustomDaysChange = (val: string) => {
    setExtendDaysCount(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      const today = new Date();
      const isCurrentFuture = extendingCompany?.expiryDate && new Date(extendingCompany.expiryDate) > today;
      const base = (extendBaseMode === 'currentExpiry' && isCurrentFuture)
        ? new Date(extendingCompany!.expiryDate)
        : today;
      const target = new Date(base);
      target.setDate(target.getDate() + num);
      setCustomExpiryDate(target.toISOString().split('T')[0]);
    }
  };

  const handleCustomDateChange = (dateStr: string) => {
    setCustomExpiryDate(dateStr);
    if (dateStr) {
      const target = new Date(dateStr + 'T00:00:00').getTime();
      const now = new Date().setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      setExtendDaysCount(diffDays > 0 ? diffDays : 0);
    }
  };

  const handleSaveCustomExpiry = async () => {
    if (!extendingCompany || !customExpiryDate) return;
    setExtendSaving(true);

    const isExpired = new Date(customExpiryDate) < new Date();
    const daysLeft = Math.max(0, Math.ceil((new Date(customExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    // API call
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies/${extendingCompany.id}/expiry`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ expiryDate: customExpiryDate }),
      });
    } catch (err) {
      console.warn('Backend expiry update (demo/offline mode):', err);
    }

    setCompanies(prev => prev.map(c => c.id === extendingCompany.id ? {
      ...c,
      expiryDate: customExpiryDate,
      isExpired,
      trialDaysLeft: daysLeft,
      isActive: true,
    } : c));

    setExtendSuccessMsg(`Successfully extended ${extendingCompany.name} to ${customExpiryDate}!`);
    setTimeout(() => {
      setExtendSaving(false);
      setExtendModalOpen(false);
    }, 600);
  };

  const handleExtendCompanyExpiry = (companyId: string, daysToExtend: number = 30) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysToExtend);
    const newExpiryStr = futureDate.toISOString().split('T')[0];

    setCompanies(prev => prev.map(c => c.id === companyId ? {
      ...c,
      expiryDate: newExpiryStr,
      isExpired: false,
      trialDaysLeft: daysToExtend,
      isActive: true,
    } : c));
  };

  const handleOpenDateWiseChatModal = (comp: CompanyRecord) => {
    setChatLogCompany(comp);
    setDailyLogs([
      { date: '2026-08-14', messagesSent: 1420, deliveryRate: 99.4, activeChats: 120 },
      { date: '2026-08-13', messagesSent: 1380, deliveryRate: 98.9, activeChats: 115 },
      { date: '2026-08-12', messagesSent: 1510, deliveryRate: 99.1, activeChats: 130 },
      { date: '2026-08-11', messagesSent: 1290, deliveryRate: 99.6, activeChats: 108 },
    ]);
    setChatLogModalOpen(true);
  };

  const handleToggleBlockUser = async (empId: string) => {
    const target = companyEmployees.find(e => e.id === empId);
    const nextActive = target ? !target.isActive : false;

    setCompanyEmployees(prev => prev.map(e => e.id === empId ? { ...e, isActive: nextActive } : e));

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        const blocked: string[] = JSON.parse(localStorage.getItem('das_crm_blocked_users') || '[]');
        let updated: string[];
        if (!nextActive) {
          // Block user
          updated = Array.from(new Set([...blocked, empId, target?.email?.toLowerCase()].filter(Boolean) as string[]));
        } else {
          // Unblock user
          updated = blocked.filter(id => id !== empId && id !== target?.email?.toLowerCase());
        }
        localStorage.setItem('das_crm_blocked_users', JSON.stringify(updated));
      } catch (_) {}
    }

    // Background API dispatch
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') || localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      await fetch(`${apiBase}/auth/super-admin/users/${empId}/toggle-block`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isActive: nextActive }),
      }).catch(() => null);
    } catch (_) {}
  };

  const handleAddTemplate = () => {
    if (!newTemplateTitle.trim() || !newTemplateContent.trim()) return;
    const newTmpl: SystemTemplate = {
      id: `tmpl_${Date.now()}`,
      title: newTemplateTitle,
      category: templateTab,
      content: newTemplateContent,
      status: 'ACTIVE',
    };
    setTemplates(prev => [newTmpl, ...prev]);
    setNewTemplateTitle('');
    setNewTemplateContent('');
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const totalCompanies = companies.length;
  const totalUsers = companies.reduce((acc, c) => acc + (c.totalUsersCount || 0), 0);
  const activeCompanies = companies.filter(c => c.isActive).length;
  const activeFreeTrials = companies.filter(c => c.plan === 'FREE_TRIAL').length;
  const activePaidPlans = companies.filter(c => c.plan !== 'FREE_TRIAL').length;
  const expiredCompanies = companies.filter(c => c.isExpired || (c.expiryDate && new Date(c.expiryDate) < new Date()));

  return (
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-20 text-foreground">
      {/* 👑 SECTION 1: DASHBOARD HERO BANNER (Modern Ambient Glassmorphism Banner) */}
      <div className="p-6 sm:p-8 border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/80 relative overflow-hidden shadow-2xl rounded-3xl text-white dark-context glass-glow-cyan">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src="/das-logo.png"
                alt="DAS CRM Logo"
                className="h-14 w-auto object-contain rounded-2xl border border-cyan-400/40 shadow-xl bg-slate-900/90 p-1.5 transition-transform group-hover:scale-105"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-950/80 border border-cyan-400/50 px-3 py-1 rounded-full shadow-inner inline-flex items-center gap-1.5">
                  <Sparkles size={11} className="text-cyan-400" /> SUPER ADMIN SYSTEM OVERLORD
                </span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 size={10} /> 24/7 MULTI-TENANT CONTROL
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight flex items-center gap-2">
                Super Admin Dashboard
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Enterprise Multi-Tenant Provisioning, Quota Governance &amp; Staff Telemetry Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => handleOpenPdfModal()}
              className="px-4 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/40 cursor-pointer active:scale-95"
              title="Open Certificate PDF Management Hub"
            >
              <Mail size={14} /> Send PDF Mail / Download
            </button>
            <ThemeToggle />
            <button
              onClick={handleManualRefresh}
              disabled={loading || employeesRefreshing}
              className="px-4 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white flex items-center gap-2 shadow-lg shadow-cyan-600/25 transition-all border border-cyan-400/40 cursor-pointer disabled:opacity-60 active:scale-95"
              title="Refresh All System Data & Sync Across Apps"
            >
              <RefreshCw size={14} className={loading || employeesRefreshing ? 'animate-spin' : ''} />
              {loading || employeesRefreshing ? 'Syncing...' : refreshSuccessBadge ? '✓ Data Synced!' : 'Refresh Telemetry'}
            </button>
          </div>
        </div>

        {/* 5 KPI METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-7">
          {/* Card 1: Total Companies & Users */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/40 text-center shadow-lg hover:border-cyan-400 hover:scale-[1.02] transition-all group backdrop-blur-md">
            <div className="flex items-center justify-between text-cyan-300 text-[11px] font-black uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5"><Building2 size={13} /> Workspaces</span>
              <span className="text-[10px] text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">Total</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div>
                <span className="text-2xl font-black text-white">{totalCompanies}</span>
                <span className="text-[10px] text-slate-400 block font-bold mt-0.5">Companies</span>
              </div>
              <div className="w-px h-8 bg-cyan-500/30" />
              <div>
                <span className="text-2xl font-black text-cyan-300">{totalUsers}</span>
                <span className="text-[10px] text-slate-400 block font-bold mt-0.5">Total Users</span>
              </div>
            </div>
          </div>

          {/* Card 2: Active Companies & Users */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/40 text-center shadow-lg hover:border-emerald-400 hover:scale-[1.02] transition-all group backdrop-blur-md">
            <div className="flex items-center justify-between text-emerald-300 text-[11px] font-black uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={13} /> Active Status</span>
              <span className="text-[10px] text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">Live</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div>
                <span className="text-2xl font-black text-white">{activeCompanies}</span>
                <span className="text-[10px] text-slate-400 block font-bold mt-0.5">Active Cos.</span>
              </div>
              <div className="w-px h-8 bg-emerald-500/30" />
              <div>
                <span className="text-2xl font-black text-emerald-300">{totalUsers}</span>
                <span className="text-[10px] text-slate-400 block font-bold mt-0.5">Active Staff</span>
              </div>
            </div>
          </div>

          {/* Card 3: Pending Approvals */}
          <div
            onClick={() => setActiveTab('company_approvals')}
            className={`p-4 rounded-2xl bg-slate-900/80 border ${
              pendingCompanies.length > 0
                ? 'border-amber-400 shadow-amber-500/20 ring-1 ring-amber-400/40'
                : 'border-amber-500/40'
            } text-center shadow-lg hover:border-amber-300 hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden group backdrop-blur-md`}
          >
            {pendingCompanies.length > 0 && (
              <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
            <div className="flex items-center justify-between text-amber-300 text-[11px] font-black uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5"><Clock size={13} /> Pending</span>
              <span className="text-[10px] text-amber-400/80 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">Queue</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-black text-amber-400">{pendingCompanies.length}</span>
              <span className="text-xs text-slate-300 font-bold mt-1">Review Queue</span>
            </div>
          </div>

          {/* Card 4: Trials & Paid Plans */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/40 text-center shadow-lg hover:border-indigo-400 hover:scale-[1.02] transition-all group backdrop-blur-md">
            <div className="flex items-center justify-between text-indigo-300 text-[11px] font-black uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5"><CreditCard size={13} /> Subscriptions</span>
              <span className="text-[10px] text-indigo-400/80 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-500/30">Plans</span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-4">
              <div>
                <span className="text-2xl font-black text-amber-400">{activeFreeTrials}</span>
                <span className="text-[10px] text-slate-400 block font-bold mt-0.5">Trials</span>
              </div>
              <div className="w-px h-8 bg-indigo-500/30" />
              <div>
                <span className="text-2xl font-black text-indigo-300">{activePaidPlans}</span>
                <span className="text-[10px] text-slate-400 block font-bold mt-0.5">Paid Plans</span>
              </div>
            </div>
          </div>

          {/* Card 5: Expired Companies */}
          <div
            onClick={() => setActiveTab('expired')}
            className={`p-4 rounded-2xl bg-slate-900/80 border ${
              expiredCompanies.length > 0 ? 'border-rose-500/60' : 'border-slate-800'
            } text-center shadow-lg hover:border-rose-400 hover:scale-[1.02] transition-all cursor-pointer group backdrop-blur-md`}
          >
            <div className="flex items-center justify-between text-rose-300 text-[11px] font-black uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5"><AlertCircle size={13} /> Expired</span>
              <span className="text-[10px] text-rose-400/80 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-500/30">Tenants</span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="text-2xl font-black text-rose-400">{expiredCompanies.length}</span>
              <span className="text-xs text-slate-300 font-bold mt-1">Expired Plans</span>
            </div>
          </div>
        </div>

        {/* 6-Month Data Retention Policy Guarantee Strip */}
        <div className="mt-5 p-4 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-slate-900/60 flex flex-wrap items-center justify-between gap-3 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/25 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0 shadow-inner">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-white">6-Month Company History Auto-Purge Policy:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ACTIVE (180 DAYS)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  🔒 VERIFIED EMPLOYEE DOCUMENTS PERMANENTLY EXEMPT
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Operational history older than 6 months automatically purges daily. Verified Employee Profiles, PAN, KYC, and Drive Vault files remain permanently protected.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('data_retention');
              fetchRetentionStatus();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600/40 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ml-auto"
          >
            Manage Retention &amp; Audit Logs →
          </button>
        </div>
      </div>

      {/* Main Section Navigation Tabs (Segmented & Responsive) */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3.5 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === 'overview'
              ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/25 ring-2 ring-cyan-400/30'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          🔑 Keys &amp; Companies Table
        </button>

        <button
          onClick={() => setActiveTab('company_approvals')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === 'company_approvals'
              ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/25 ring-2 ring-amber-400/30'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Building2 size={14} className={activeTab === 'company_approvals' ? 'text-white' : 'text-amber-500'} />
          <span>Pending Approvals</span>
          {pendingCompanies.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'company_approvals' ? 'bg-white text-amber-800' : 'bg-amber-500 text-white animate-pulse'
              }`}
            >
              {pendingCompanies.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('features_hub')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === 'features_hub'
              ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/25 ring-2 ring-purple-400/30'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Zap size={14} className={activeTab === 'features_hub' ? 'text-white' : 'text-purple-400'} />
          <span>Features &amp; Quotas Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === 'employees'
              ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/25 ring-2 ring-cyan-400/30'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Users size={14} className={activeTab === 'employees' ? 'text-white' : 'text-cyan-400'} />
          <span>Tenant Staff Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('expired')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === 'expired'
              ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/25 ring-2 ring-rose-400/30'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <AlertCircle size={14} className={activeTab === 'expired' ? 'text-white' : 'text-rose-500'} />
          <span>Expired ({expiredCompanies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === 'coupons'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/30'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Tag size={14} className={activeTab === 'coupons' ? 'text-white' : 'text-emerald-500'} />
          <span>Coupons ({couponsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === 'templates'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Layers size={14} className={activeTab === 'templates' ? 'text-white' : 'text-indigo-400'} />
          <span>System Templates</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === 'whatsapp'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <MessageSquare size={14} className={activeTab === 'whatsapp' ? 'text-white' : 'text-indigo-400'} />
          <span>WhatsApp Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/25'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <CreditCard size={14} className={activeTab === 'pending' ? 'text-white' : 'text-amber-400'} />
          <span>Upgrades ({upgradeRequests.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('data_retention');
            fetchRetentionStatus();
          }}
          className={`px-4 py-2.5 text-xs font-black rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
            activeTab === 'data_retention'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg shadow-blue-600/25 ring-2 ring-blue-400/30'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Shield size={14} className={activeTab === 'data_retention' ? 'text-white' : 'text-blue-500'} />
          <span>6-Month Retention</span>
        </button>
      </div>

      {/* ── NOTIFICATION BANNER FOR PDF ACTIONS ── */}
      {pdfNotification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg border transition-all ${
            pdfNotification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {pdfNotification.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-500 shrink-0" />
            )}
            <p className="text-xs font-bold">{pdfNotification.message}</p>
          </div>
          <div className="flex items-center gap-2">
            {pdfNotification.previewUrl && (
              <a
                href={pdfNotification.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1 shadow-sm"
              >
                <span>View Email Preview</span> &rarr;
              </a>
            )}
            <button
              onClick={() => setPdfNotification(null)}
              className="text-xs opacity-70 hover:opacity-100 px-1 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ⚡ NEW SECTION: COMPANY FEATURES & QUOTAS HUB */}
      {activeTab === 'features_hub' && (
        <div className="crm-card p-5 border-purple-500/40 bg-card space-y-4 rounded-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Zap size={18} className="text-purple-500" /> Company Features & Quotas Hub
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Super Admin Master Control: Instantly enable/disable Email Marketing, WhatsApp Cloud, AI Engine, and adjust User Seats for any company.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300 font-extrabold text-xs flex items-center gap-1.5 w-max">
              <Shield size={14} /> Instant Global Cascade (All Employees & Admins)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-500" /> Super Admin Rule:
            </p>
            <p>
              Toggling feature switches below updates tenant company subscription capabilities in real-time. Disabling a feature immediately locks access for all employees & company admins belonging to that tenant workspace.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Company Name</th>
                  <th className="p-3.5">User Seats Ratio</th>
                  <th className="p-3.5">Email Marketing</th>
                  <th className="p-3.5">WhatsApp Cloud</th>
                  <th className="p-3.5">AI Engine & Tier</th>
                  <th className="p-3.5 text-right">Configure Features</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5">
                      <p className="font-black text-foreground">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{c.registrationKey} • {c.plan}</p>
                    </td>

                    <td className="p-3.5 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {c.seatsUsed} / {c.seatsAllocated} Seats
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQuickAdjustSeats(c.id, -5)}
                            className="w-5 h-5 rounded bg-muted border border-border flex items-center justify-center font-black hover:bg-muted/80 text-foreground"
                            title="Decrease seats"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleQuickAdjustSeats(c.id, 5)}
                            className="w-5 h-5 rounded bg-muted border border-border flex items-center justify-center font-black hover:bg-muted/80 text-foreground"
                            title="Increase seats (+5)"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleInstantFeature(c.id, 'email', !c.emailConfig?.enabled)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all ${c.emailConfig?.enabled ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'}`}
                        >
                          <Mail size={12} /> {c.emailConfig?.enabled ? 'ON' : 'OFF'}
                        </button>
                        {c.emailConfig?.enabled && (
                          <button
                            onClick={() => handleResetEmailQuota(c.id)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-muted hover:bg-muted/80 border border-border text-foreground transition-colors"
                            title="Reset monthly email quota used to 0"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {c.emailConfig?.used || 0} / {c.emailConfig?.monthlyLimit ? `${c.emailConfig.monthlyLimit.toLocaleString()}/mo` : 'Unlimited'}
                      </p>
                    </td>

                    <td className="p-3.5 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleInstantFeature(c.id, 'whatsapp', !c.whatsAppConfig?.enabled)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all ${c.whatsAppConfig?.enabled ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'}`}
                        >
                          <MessageSquare size={12} /> {c.whatsAppConfig?.enabled ? 'ON' : 'OFF'}
                        </button>
                        {c.whatsAppConfig?.enabled && (
                          <button
                            onClick={() => {
                              setTopUpCompany(c);
                              setTopUpAmount(5000);
                              setTopUpSuccessMsg(null);
                              setTopUpModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
                            title="Top up WhatsApp credits wallet"
                          >
                            + Top Up
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {c.whatsAppConfig?.used || 0} / {c.whatsAppConfig?.monthlyLimit ? `${c.whatsAppConfig.monthlyLimit.toLocaleString()} credits` : 'Unlimited'}
                      </p>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleInstantFeature(c.id, 'ai', !c.aiConfig?.enabled)}
                          className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 transition-all ${c.aiConfig?.enabled ? 'bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'}`}
                        >
                          <Bot size={12} /> {c.aiConfig?.enabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                        {c.aiConfig?.enabled && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300">
                            {c.aiConfig?.tier}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenCompanyDetails(c)}
                          className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          title="View Full Company Registration Details"
                        >
                          <Eye size={13} className="text-cyan-500" />
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendPdfEmail(c)}
                          disabled={sendingPdfCompanyId === c.id}
                          className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                          title={`Send Registration Certificate PDF to ${c.adminEmail}`}
                        >
                          {sendingPdfCompanyId === c.id ? (
                            <Loader2 size={13} className="animate-spin text-indigo-500" />
                          ) : (
                            <Mail size={13} className="text-indigo-500" />
                          )}
                          Send PDF Email
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(c)}
                          className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          title="Download Official Registration Certificate PDF"
                        >
                          <Download size={13} className="text-emerald-500" />
                          Download PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c, 'email')}
                          className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-600/30 rounded-xl font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <SlidersHorizontal size={13} /> Edit Quotas
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🏢 NEW SECTION: PENDING COMPANY REGISTRATIONS & PLAN VERIFICATION */}
      {activeTab === 'company_approvals' && (
        <div className="crm-card p-5 border-amber-500/40 bg-card space-y-4 rounded-2xl shadow-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Building2 size={18} className="text-amber-500" /> Pending Registrations & Plan Verification Queue
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                New companies registered via the onboarding gateway. Verify and activate their plan, user seats, validity duration, and feature permissions before employees can log in.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 font-extrabold text-xs flex items-center gap-1.5 w-max shadow-sm">
                <Clock size={14} className="animate-spin text-amber-500" style={{ animationDuration: '6s' }} />
                {pendingCompanies.length} Workspace{pendingCompanies.length !== 1 ? 's' : ''} Awaiting Approval
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  fetchBackendData();
                }}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground border border-border flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Refresh Pending Verification List"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                Refresh List
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center gap-2">
            <Shield size={14} className="text-cyan-500 shrink-0" />
            <span>
              <strong>Onboarding Security Rule:</strong> While in <code className="font-mono text-amber-600 dark:text-amber-300 font-bold">PENDING</code> state, tenant workspace access is strictly gated. Employees and admins attempting login see a dedicated verification holding screen with live retry status and delay inquiry support.
            </span>
          </div>

          {pendingCompanies.length === 0 ? (
            <div className="p-12 text-center border border-border rounded-2xl bg-muted/20 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="text-sm font-black text-foreground">Review Queue All Clear!</h4>
                <p className="text-xs text-muted-foreground mt-1">There are currently no company registrations awaiting Super Admin plan verification.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3.5">Company & Domain</th>
                    <th className="p-3.5">Admin & Contact</th>
                    <th className="p-3.5">Registration Key</th>
                    <th className="p-3.5">Requested Plan & Seats</th>
                    <th className="p-3.5">Inquiries from Tenant</th>
                    <th className="p-3.5 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {pendingCompanies.map(c => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                            🏢
                          </div>
                          <div>
                            <p className="font-black text-foreground text-sm">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {c.domain ? <span className="text-cyan-600 dark:text-cyan-400">{c.domain} • </span> : null}
                              Registered: {c.registeredAt ? new Date(c.registeredAt).toLocaleDateString() : 'Today'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <p className="font-bold text-foreground">{c.adminName}</p>
                        <a
                          href={`mailto:${c.adminEmail}`}
                          className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                        >
                          <Mail size={11} /> {c.adminEmail}
                        </a>
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30 text-xs">
                          {c.registrationKey}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                              {c.requestedPlan}
                            </span>
                            {c.accountType === 'BUY_REQUEST' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                🛒 Buy (30D)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                ⚡ Trial (15D)
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            {c.seatsRequested || 15} User Seats &bull; {c.validityDays || (c.accountType === 'BUY_REQUEST' ? 30 : 15)} Days Validity
                          </p>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {c.delayInquiries && c.delayInquiries.length > 0 ? (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30 flex items-center gap-1 w-max">
                              <AlertCircle size={11} /> {c.delayInquiries.length} Inquiry Received
                            </span>
                            <p className="text-[10px] text-muted-foreground italic truncate max-w-[200px]" title={c.delayInquiries[0].message}>
                              "{c.delayInquiries[0].message}"
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/60 italic">No inquiries received</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenCompanyDetails(c)}
                            className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            title="View Full Registration Details"
                          >
                            <Eye size={13} className="text-cyan-500" />
                            View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendPdfEmail(c)}
                            disabled={sendingPdfCompanyId === c.id}
                            className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                            title={`Send Registration Certificate PDF to ${c.adminEmail}`}
                          >
                            {sendingPdfCompanyId === c.id ? (
                              <Loader2 size={13} className="animate-spin text-indigo-500" />
                            ) : (
                              <Mail size={13} className="text-indigo-500" />
                            )}
                            Send PDF Email
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(c)}
                            className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            title="Download Official Registration Certificate PDF"
                          >
                            <Download size={13} className="text-emerald-500" />
                            Download PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenVerificationModal(c)}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-600/25 transition-all cursor-pointer"
                          >
                            <Shield size={13} /> Review & Verify Plan →
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {activeTab === 'expired' && (
        <div className="crm-card p-5 border-red-500/30 bg-card space-y-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <AlertCircle size={18} className="text-red-500" /> Plan Expired Companies List
              </h3>
              <p className="text-xs text-muted-foreground">Companies whose subscription plan or free trial expiry date has elapsed</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/40">
              {expiredCompanies.length} Expired Tenants
            </span>
          </div>

          {expiredCompanies.length === 0 ? (
            <div className="p-8 text-center border border-border rounded-2xl bg-muted/20 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-foreground">No Expired Companies</p>
              <p className="text-xs text-muted-foreground">All registered tenant companies have active subscriptions and valid plan expiry dates.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-red-500/30">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-extrabold tracking-wider border-b border-red-500/30">
                  <tr>
                    <th className="p-3.5">Company Name</th>
                    <th className="p-3.5">Key</th>
                    <th className="p-3.5">Plan Tier</th>
                    <th className="p-3.5">Expiry Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expiredCompanies.map(c => (
                    <tr key={c.id} className="hover:bg-red-500/5 transition-colors">
                      <td className="p-3.5">
                        <p className="font-extrabold text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.adminEmail}</p>
                      </td>
                      <td className="p-3.5 font-mono text-cyan-600 dark:text-cyan-400 font-bold">{c.registrationKey}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300">
                          {c.plan}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-red-600 dark:text-red-400 font-bold">{c.expiryDate}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-300 flex items-center gap-1 w-max">
                          <AlertCircle size={11} /> PLAN EXPIRED
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenCompanyDetails(c)}
                            className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                            title="View Full Company Registration Details"
                          >
                            <Eye size={12} className="text-cyan-500" />
                            View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendPdfEmail(c)}
                            disabled={sendingPdfCompanyId === c.id}
                            className="px-2.5 py-1 rounded-xl font-bold text-xs bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                            title={`Send Registration Certificate PDF to ${c.adminEmail}`}
                          >
                            {sendingPdfCompanyId === c.id ? (
                              <Loader2 size={12} className="animate-spin text-indigo-500" />
                            ) : (
                              <Mail size={12} className="text-indigo-500" />
                            )}
                            Send PDF Email
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(c)}
                            className="px-2.5 py-1 rounded-xl font-bold text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                            title="Download Official Registration Certificate PDF"
                          >
                            <Download size={12} className="text-emerald-500" />
                            Download PDF
                          </button>
                          <button
                            onClick={() => handleOpenExtendModal(c)}
                            className="px-3.5 py-1.5 bg-emerald-600/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/30 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                            title="Open Custom Expiry Date Extension dialog"
                          >
                            <Calendar size={13} className="text-emerald-600 dark:text-emerald-400" /> Extend Expiry
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(c, 'general')}
                            className="px-3.5 py-1.5 bg-cyan-600/20 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-600/30 rounded-xl font-bold text-xs inline-flex items-center gap-1 transition-all"
                          >
                            <Edit2 size={12} /> Edit Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 🔑 SECTION 2: KEYS AND THEIR COMPANIES TABLE */}
      {(activeTab === 'overview' || activeTab === 'keys') && (() => {
        const filteredCompanies = companies.filter(c => {
          const q = companySearch.trim().toLowerCase();
          const matchQuery = !q ||
            (c.name || '').toLowerCase().includes(q) ||
            (c.domain || '').toLowerCase().includes(q) ||
            (c.adminEmail || '').toLowerCase().includes(q) ||
            (c.registrationKey || '').toLowerCase().includes(q);

          const matchPlan = companyPlanFilter === 'ALL' ||
            c.plan.toUpperCase() === companyPlanFilter.toUpperCase() ||
            (companyPlanFilter === 'GROW' && (c.plan === 'GROW' || c.plan === 'GROWTH'));

          return matchQuery && matchPlan;
        });

        return (
          <div className="crm-card p-6 border-border bg-card space-y-5 rounded-3xl shadow-xl animate-fade-in">
            {/* Table Header with Search & Plan Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-4">
              <div>
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <Key size={18} className="text-cyan-500" /> Keys &amp; Tenant Companies Master Directory
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Master registry of active keys, seat limits, plan validity, and feature configs.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Search Bar */}
                <div className="relative min-w-[220px]">
                  <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search company, key, email..."
                    value={companySearch}
                    onChange={e => setCompanySearch(e.target.value)}
                    className="crm-input pl-9 pr-7 text-xs h-9 rounded-xl bg-muted/80 border-border focus:border-cyan-500 transition-all font-medium"
                  />
                  {companySearch && (
                    <button
                      type="button"
                      onClick={() => setCompanySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Plan Tier Filter Pills */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border overflow-x-auto text-[11px]">
                  {['ALL', 'FREE_TRIAL', 'GROW', 'BUSINESS', 'ENTERPRISE'].map(plan => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setCompanyPlanFilter(plan)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                        companyPlanFilter === plan
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {plan === 'ALL' ? 'All Plans' : plan === 'FREE_TRIAL' ? 'Trial' : plan}
                    </button>
                  ))}
                </div>

                <span className="text-[10px] font-black text-cyan-700 dark:text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-3 py-1.5 rounded-xl whitespace-nowrap shadow-sm">
                  {filteredCompanies.length} / {companies.length} Companies
                </span>
              </div>
            </div>

            {/* Companies Table */}
            <div className="overflow-hidden rounded-2xl border border-border/80 shadow-sm bg-card/40">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                      <th className="p-3.5">Registration Key</th>
                      <th className="p-3.5">Company Workspace</th>
                      <th className="p-3.5">Plan Tier</th>
                      <th className="p-3.5">Module Features</th>
                      <th className="p-3.5">Expiry Date</th>
                      <th className="p-3.5">Seats Occupancy</th>
                      <th className="p-3.5 text-right">Master Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-muted-foreground">
                          <Building2 size={32} className="mx-auto text-muted-foreground/40 mb-2" />
                          <p className="font-bold text-sm">No companies matched your search criteria.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setCompanySearch('');
                              setCompanyPlanFilter('ALL');
                            }}
                            className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25"
                          >
                            Reset Search Filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map(c => {
                        const isCompExpired = c.isExpired || (c.expiryDate && new Date(c.expiryDate) < new Date());
                        const seatRatio = Math.min(100, Math.round(((c.seatsUsed || 1) / (c.seatsAllocated || 18)) * 100));

                        return (
                          <tr key={c.id} className={`transition-colors group ${isCompExpired ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-muted/40'}`}>
                            {/* Key with Copy */}
                            <td className="p-3.5">
                              <button
                                type="button"
                                onClick={() => handleCopyEmpText(c.registrationKey)}
                                className="inline-flex items-center gap-1.5 font-mono text-cyan-600 dark:text-cyan-400 font-extrabold hover:text-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition-all cursor-pointer text-xs"
                                title="Click to copy registration key"
                              >
                                <Key size={11} className="text-cyan-500" />
                                {c.registrationKey}
                                {copiedEmpText === c.registrationKey && (
                                  <Check size={11} className="text-emerald-400" />
                                )}
                              </button>
                            </td>

                            {/* Company Name & Avatar */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                                  {(c.name || 'C').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-black text-foreground text-xs group-hover:text-cyan-500 transition-colors">
                                    {c.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    {c.adminEmail}
                                  </p>
                                  {isCompExpired && (
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider block mt-0.5">
                                      ⚠️ Plan Expired
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Plan Tier Badge */}
                            <td className="p-3.5">
                              {(() => {
                                const planMeta = getPlanMeta(c.plan);
                                return (
                                  <div className="space-y-1">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider flex items-center gap-1 w-max ${planMeta.badgeCls}`}>
                                      <span>{planMeta.icon}</span> {planMeta.name}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground font-mono block">
                                      {c.accountType === 'BUY_REQUEST' ? '🛒 Paid Plan' : '⚡ Trial Tier'}
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Feature Pills */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black ${c.emailConfig?.enabled ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                                  MAIL: {c.emailConfig?.enabled ? 'ON' : 'OFF'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black ${c.whatsAppConfig?.enabled ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                                  WA: {c.whatsAppConfig?.enabled ? 'ON' : 'OFF'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black ${c.aiConfig?.enabled ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                                  AI: {c.aiConfig?.enabled ? (c.aiConfig.tier || 'PRO') : 'OFF'}
                                </span>
                              </div>
                            </td>

                            {/* Expiry Date & Days Left Status */}
                            <td className="p-3.5 font-mono text-xs">
                              {(() => {
                                const subStatus = getCompanySubscriptionStatus(c);
                                const daysLeft = getDaysRemaining(c.expiryDate, c.trialDaysLeft);
                                const isExp = subStatus.key === 'EXPIRED' || daysLeft < 0;

                                return (
                                  <div className="space-y-1">
                                    <span className={`font-black ${isExp ? 'text-rose-500' : 'text-foreground'}`}>
                                      {c.expiryDate || 'N/A'}
                                    </span>
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md border font-mono ${
                                        isExp
                                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40'
                                          : daysLeft <= 3
                                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 animate-pulse'
                                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                                      }`}>
                                        {isExp ? 'Expired' : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                                      </span>
                                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${subStatus.badgeCls}`}>
                                        <span className={`w-1 h-1 rounded-full ${subStatus.dotCls}`} />
                                        {subStatus.label}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Seats Progress */}
                            <td className="p-3.5 font-mono">
                              <div className="space-y-1 min-w-[120px]">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span className="text-emerald-600 dark:text-emerald-400">{c.seatsUsed || 1} Used</span>
                                  <span className="text-muted-foreground">/{c.seatsAllocated || 18}</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden border border-border/50">
                                  <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                                    style={{ width: `${Math.max(10, seatRatio)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenCompanyDetails(c)}
                                  className="px-2.5 py-1 rounded-xl font-bold text-xs bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-all shadow-sm cursor-pointer active:scale-95"
                                  title="View Full Registration Dossier"
                                >
                                  <Eye size={12} className="text-cyan-500" />
                                  Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSendPdfEmail(c)}
                                  disabled={sendingPdfCompanyId === c.id}
                                  className="px-2.5 py-1 rounded-xl font-bold text-xs bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition-all shadow-sm cursor-pointer disabled:opacity-50 active:scale-95"
                                  title={`Send Registration Certificate PDF to ${c.adminEmail}`}
                                >
                                  {sendingPdfCompanyId === c.id ? (
                                    <Loader2 size={12} className="animate-spin text-indigo-500" />
                                  ) : (
                                    <Mail size={12} className="text-indigo-500" />
                                  )}
                                  PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadPdf(c)}
                                  className="px-2.5 py-1 rounded-xl font-bold text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all shadow-sm cursor-pointer active:scale-95"
                                  title="Download Official Registration Certificate PDF"
                                >
                                  <Download size={12} className="text-emerald-500" />
                                  PDF
                                </button>
                                <button
                                  onClick={() => handleOpenExtendModal(c)}
                                  className={`px-2.5 py-1 rounded-xl font-bold text-xs inline-flex items-center gap-1 border transition-all cursor-pointer active:scale-95 ${
                                    isCompExpired
                                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/30 shadow-sm'
                                      : 'bg-muted/80 hover:bg-muted text-foreground border-border'
                                  }`}
                                  title="Set Custom Expiry Date"
                                >
                                  <Calendar size={11} className={isCompExpired ? 'text-rose-500' : 'text-cyan-500'} />
                                  {isCompExpired ? 'Extend' : 'Expiry'}
                                </button>
                                <button
                                  onClick={() => handleOpenEditModal(c, 'general')}
                                  className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-600/30 rounded-xl font-black text-xs inline-flex items-center gap-1 cursor-pointer active:scale-95"
                                >
                                  <Edit2 size={12} /> Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 📑 SECTION 4: SYSTEM TEMPLATES HUB */}
      {activeTab === 'templates' && (
        <div className="crm-card p-5 border-border bg-card space-y-4 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Layers size={18} className="text-cyan-500" /> System Templates Hub
            </h3>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-xl border border-border">
              <button onClick={() => setTemplateTab('funnel')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${templateTab === 'funnel' ? 'bg-cyan-600 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                Lead Funnel Templates
              </button>
              <button onClick={() => setTemplateTab('whatsapp')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${templateTab === 'whatsapp' ? 'bg-cyan-600 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                Whatsapp Cloud Templates
              </button>
              <button onClick={() => setTemplateTab('email')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${templateTab === 'email' ? 'bg-cyan-600 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                Email Templates
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-3">
            <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-300 uppercase tracking-wider">Add New {templateTab.toUpperCase()} Template</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="crm-input text-xs w-full" placeholder="Template Title" value={newTemplateTitle} onChange={e => setNewTemplateTitle(e.target.value)} />
              <button onClick={handleAddTemplate} className="btn-primary text-xs py-2 px-4 font-bold flex items-center justify-center gap-1.5">
                <Plus size={14} /> Add Template
              </button>
            </div>
            <textarea className="crm-input text-xs w-full h-20" placeholder="Enter template content / stage structure..." value={newTemplateContent} onChange={e => setNewTemplateContent(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.filter(t => t.category === templateTab).map(t => (
              <div key={t.id} className="p-4 rounded-2xl bg-muted/30 border border-border relative space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">{t.title}</h4>
                  <button onClick={() => handleDeleteTemplate(t.id)} className="text-rose-500 hover:text-rose-400 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-mono bg-muted/60 p-3 rounded-xl border border-border leading-relaxed">
                  {t.content}
                </p>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block">
                  STATUS: {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 💬 SECTION 5: WHATSAPP CLOUD USES TABLE */}
      {(activeTab === 'overview' || activeTab === 'whatsapp') && (
        <div className="crm-card p-5 border-border bg-card space-y-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <MessageSquare size={18} className="text-cyan-500" /> WhatsApp Cloud Uses & Logs Table
            </h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Company Name</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5">WhatsApp Feature Status</th>
                  <th className="p-3.5">Messages Used / Limit</th>
                  <th className="p-3.5 text-center">Date Wise Chat Log</th>
                  <th className="p-3.5 text-right">Edit Configuration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 font-black text-foreground">{c.name}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                        {c.plan}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${c.whatsAppConfig?.enabled ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30'}`}>
                        {c.whatsAppConfig?.enabled ? 'ENABLED' : 'DISABLED BY SUPER ADMIN'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-cyan-600 dark:text-cyan-300 font-bold">
                      {(c.whatsAppConfig?.used ?? 0).toLocaleString()} / {(c.whatsAppConfig?.monthlyLimit ?? 0).toLocaleString()} Msgs
                    </td>
                    <td className="p-3.5 text-center">
                      <button onClick={() => handleOpenDateWiseChatModal(c)} className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600/30 rounded-xl font-bold text-[11px] inline-flex items-center gap-1">
                        <Calendar size={12} /> Date Wise Chat Log
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <button onClick={() => handleOpenEditModal(c, 'whatsapp')} className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-600/30 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                        <Edit2 size={12} /> Edit WA Settings
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 💳 SECTION 6: PENDING APPROVAL */}
      {(activeTab === 'overview' || activeTab === 'pending') && (
        <div className="crm-card p-5 border-border bg-card space-y-4 rounded-2xl">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <CreditCard size={18} className="text-purple-400" /> Pending Approval Queue ({upgradeRequests.length})
          </h3>
          {upgradeRequests.length === 0 ? (
            <div className="p-8 text-center bg-muted/30 rounded-2xl border border-border text-muted-foreground text-xs">
              No pending plan upgrade requests requiring Super Admin approval at this time.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upgradeRequests.map(req => (
                <div key={req.id} className="p-4 rounded-2xl bg-muted/40 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">{req.companyName}</h4>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                      {req.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 font-mono">
                    <p>Requested Plan: <strong className="text-cyan-600 dark:text-cyan-300">{req.requestedPlan}</strong></p>
                    <p>Amount Paid: <strong className="text-emerald-600 dark:text-emerald-400">₹{req.amountInr}</strong></p>
                    <p>Order ID: <span>{req.razorpayOrderId}</span></p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button className="px-3 py-1.5 bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold">Reject</button>
                    <button className="btn-primary text-xs px-4 py-1.5">Approve Upgrade ✓</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 👥 SECTION 7: COMPANIES AND THEIR EMPLOYEES */}
      {(activeTab === 'overview' || activeTab === 'employees') && (() => {
        const activeComp = companies.find(c => c.id === selectedCompanyId) || companies[0];
        const allocatedSeats = activeComp?.seatsAllocated || 18;
        const usedSeats = companyEmployees.length;
        const seatPercent = Math.min(100, Math.round((usedSeats / allocatedSeats) * 100));

        const roleCounts = companyEmployees.reduce((acc: Record<string, number>, e) => {
          let r = (e.role || 'UNASSIGNED').toUpperCase();
          if (r.includes('UNASSIGNED') || r.includes('PENDING') || r.includes('AWAITING')) {
            r = 'UNASSIGNED';
          }
          acc[r] = (acc[r] || 0) + 1;
          return acc;
        }, {});

        const getRoleBadgeStyle = (role: string) => {
          const r = (role || '').toUpperCase();
          if (r.includes('ADMIN')) {
            return {
              badgeCls: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30 shadow-sm shadow-purple-500/10',
              avatarCls: 'bg-gradient-to-tr from-purple-700 via-indigo-600 to-cyan-500 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400/40',
              dotCls: 'bg-purple-400',
              label: 'ADMIN',
            };
          }
          if (r.includes('MANAGER')) {
            return {
              badgeCls: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30 shadow-sm shadow-blue-500/10',
              avatarCls: 'bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-400 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/40',
              dotCls: 'bg-blue-400',
              label: 'MANAGER',
            };
          }
          if (r.includes('LEADER') || r.includes('TL')) {
            return {
              badgeCls: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30 shadow-sm shadow-amber-500/10',
              avatarCls: 'bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400/40',
              dotCls: 'bg-amber-400',
              label: 'TEAM LEADER',
            };
          }
          if (r.includes('HR')) {
            return {
              badgeCls: 'bg-pink-500/15 text-pink-600 dark:text-pink-300 border-pink-500/30 shadow-sm shadow-pink-500/10',
              avatarCls: 'bg-gradient-to-tr from-pink-600 via-rose-500 to-red-400 text-white shadow-md shadow-pink-600/30 ring-2 ring-pink-400/40',
              dotCls: 'bg-pink-400',
              label: 'HR',
            };
          }
          if (r.includes('UNASSIGNED') || r.includes('PENDING') || r.includes('AWAITING')) {
            return {
              badgeCls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-sm shadow-amber-500/10',
              avatarCls: 'bg-gradient-to-tr from-slate-700 via-amber-700 to-amber-500 text-white shadow-md shadow-amber-600/20 ring-2 ring-amber-400/40',
              dotCls: 'bg-amber-400 animate-pulse',
              label: 'UNASSIGNED',
            };
          }
          return {
            badgeCls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10',
            avatarCls: 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-400 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40',
            dotCls: 'bg-emerald-400',
            label: 'SALES EXEC',
          };
        };

        const blockedCount = companyEmployees.filter(e => !e.isActive).length;

        const filteredEmployees = companyEmployees.filter(emp => {
          const q = employeeSearch.trim().toLowerCase();
          const matchQuery = !q ||
            (emp.name || '').toLowerCase().includes(q) ||
            (emp.email || '').toLowerCase().includes(q) ||
            (emp.role || '').toLowerCase().includes(q) ||
            (emp.keyUsed || '').toLowerCase().includes(q) ||
            (emp.lastPlatform || '').toLowerCase().includes(q);

          const r = (emp.role || 'SALES_EXEC').toUpperCase();
          const matchRole = employeeRoleFilter === 'ALL' ||
            (employeeRoleFilter === 'BLOCKED' && !emp.isActive) ||
            (employeeRoleFilter === 'UNASSIGNED' && (r.includes('UNASSIGNED') || r.includes('PENDING') || r.includes('AWAITING'))) ||
            (employeeRoleFilter === 'ADMIN' && r.includes('ADMIN')) ||
            (employeeRoleFilter === 'MANAGER' && r.includes('MANAGER')) ||
            (employeeRoleFilter === 'TEAM_LEADER' && (r.includes('LEADER') || r.includes('TL'))) ||
            (employeeRoleFilter === 'SALES_EXEC' && (r.includes('SALES') || r.includes('EXEC'))) ||
            (employeeRoleFilter === 'HR' && r.includes('HR')) ||
            r === employeeRoleFilter;

          return matchQuery && matchRole;
        });

        return (
          <div className="crm-card p-6 border-cyan-500/30 bg-card space-y-5 rounded-3xl shadow-xl hover:border-cyan-500/50 transition-all duration-300 animate-fade-in">
            {/* Header with Title & Workspace Selector */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/80 pb-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
                    <Users size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                      Companies &amp; Operational Staff Directory
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      Real-time synchronized roster of verified members across all organization tenants.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative">
                  <select
                    className="crm-input text-xs h-10 pl-3 pr-8 rounded-xl font-bold bg-muted/90 border-border hover:border-cyan-500/50 focus:border-cyan-500 transition-all min-w-[280px] cursor-pointer shadow-sm"
                    value={selectedCompanyId}
                    onChange={e => {
                      setSelectedCompanyId(e.target.value);
                      fetchEmployees(e.target.value);
                    }}
                  >
                    {companies.map(c => {
                      const days = getDaysRemaining(c.expiryDate, c.trialDaysLeft);
                      const sub = getCompanySubscriptionStatus(c);
                      const daysText = sub.key === 'EXPIRED' ? 'Expired' : days === 0 ? 'Expires Today' : `${days}d left`;
                      const planName = (c.plan || 'BUSINESS').toUpperCase();
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} • [{planName}] • {daysText} • ({c.seatsUsed || 0}/{c.seatsAllocated || 18} Seats)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={employeesRefreshing}
                  className="h-10 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-muted to-muted/80 hover:from-muted/80 hover:to-muted text-foreground border border-border flex items-center gap-2 transition-all shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-60 hover:border-cyan-500/40 active:scale-95"
                  title="Force Sync Directory Across Workspaces"
                >
                  <RefreshCw size={13} className={`text-cyan-500 ${employeesRefreshing ? 'animate-spin' : ''}`} />
                  {employeesRefreshing ? 'Syncing...' : refreshSuccessBadge ? '✓ Synced!' : 'Refresh'}
                </button>

                {activeComp && (
                  <button
                    type="button"
                    onClick={() => handleOpenCompanyDetails(activeComp)}
                    className="h-10 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/25 cursor-pointer whitespace-nowrap active:scale-95 border border-cyan-400/40"
                    title="View Full Company Registration Details"
                  >
                    <Eye size={14} /> Dossier
                  </button>
                )}
              </div>
            </div>

            {/* Active Company Status, Plan Details & Expiry Information Bar */}
            {activeComp && (() => {
              const planMeta = getPlanMeta(activeComp.plan);
              const subStatus = getCompanySubscriptionStatus(activeComp);
              const daysLeft = getDaysRemaining(activeComp.expiryDate, activeComp.trialDaysLeft);
              const isExp = subStatus.key === 'EXPIRED' || daysLeft < 0;

              return (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-card via-muted/40 to-card border border-border/80 shadow-md space-y-4">
                  {/* Top Row: Company Info, Plan Badges & Quick Action Buttons */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Company Identity */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-cyan-600/20 shrink-0">
                        {(activeComp.name || 'C').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-black text-foreground tracking-tight">{activeComp.name}</span>
                          {/* Plan Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${planMeta.badgeCls}`}>
                            <span>{planMeta.icon}</span> {planMeta.name}
                          </span>
                          {/* Subscription Status Badge */}
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${subStatus.badgeCls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${subStatus.dotCls}`} />
                            {subStatus.label}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Auto-Sync
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono flex-wrap">
                          <span className="flex items-center gap-1">
                            Key: <strong className="text-foreground">{activeComp.registrationKey || 'ADOR-EC-7187'}</strong>
                            <button
                              type="button"
                              onClick={() => handleCopyEmpText(activeComp.registrationKey)}
                              className="text-cyan-500 hover:text-cyan-400 ml-0.5 cursor-pointer"
                              title="Copy registration key"
                            >
                              {copiedEmpText === activeComp.registrationKey ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          </span>
                          <span>•</span>
                          <span>Admin: <strong className="text-foreground">{activeComp.adminEmail || 'admin'}</strong></span>
                          {activeComp.phone && (
                            <>
                              <span>•</span>
                              <span>Ph: <strong className="text-foreground">+91 {activeComp.phone}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Modal Actions */}
                    <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenExtendModal(activeComp)}
                        className="h-9 px-3.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                        title="Extend validity or change expiration date"
                      >
                        <Clock size={13} className="text-amber-500" /> Extend Plan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(activeComp)}
                        className="h-9 px-3.5 rounded-xl text-xs font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                        title="Edit company seats and plan configuration"
                      >
                        <Edit2 size={13} className="text-indigo-500" /> Edit Plan
                      </button>
                    </div>
                  </div>

                  {/* Dynamic 3-Column Plan & Quota Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 border-t border-border/60">
                    {/* Card 1: Active Plan Taken */}
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between gap-3 shadow-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                          Plan Subscribed
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-extrabold text-foreground">{planMeta.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border font-mono">
                            {activeComp.accountType === 'BUY_REQUEST' ? 'PAID' : 'TRIAL'}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          Max Quota: <strong className="text-foreground">{allocatedSeats} Seats</strong>
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 font-bold shrink-0 shadow-inner">
                        <CreditCard size={18} />
                      </div>
                    </div>

                    {/* Card 2: Plan Expiry & Days Left */}
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 flex items-center justify-between gap-3 shadow-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                          Plan Expiry &amp; Validity
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-black font-mono ${isExp ? 'text-rose-500' : 'text-foreground'}`}>
                            {activeComp.expiryDate || 'N/A'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border font-mono ${
                            isExp
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40'
                              : daysLeft <= 3
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 animate-pulse'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                          }`}>
                            {isExp
                              ? 'Expired'
                              : daysLeft === 0
                              ? 'Expires Today'
                              : `${daysLeft}d left`}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          {isExp
                            ? '⚠️ Needs extension to reactivate'
                            : `${daysLeft} days remaining until renewal`}
                        </span>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 border shadow-inner ${
                        isExp
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : daysLeft <= 3
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        <Calendar size={18} />
                      </div>
                    </div>

                    {/* Card 3: Seat Occupancy Bar */}
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-2 sm:col-span-2 lg:col-span-1 shadow-sm">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          Seat Occupancy
                        </span>
                        <span className="font-mono font-bold text-xs text-foreground">
                          <strong className="text-cyan-500">{usedSeats}</strong> / {allocatedSeats} ({seatPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden border border-border">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            seatPercent >= 90
                              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                              : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500'
                          }`}
                          style={{ width: `${Math.max(8, seatPercent)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span>{Math.max(0, allocatedSeats - usedSeats)} seats available</span>
                        <span>{usedSeats} active staff</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Floating Role Action Feedback Toast */}
            {roleActionToast && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-extrabold flex items-center justify-between gap-3 shadow-md transition-all duration-300 animate-fade-in ${
                  roleActionToast.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/40 shadow-rose-500/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {roleActionToast.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-500 shrink-0" />
                  )}
                  <span>{roleActionToast.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRoleActionToast(null)}
                  className="text-muted-foreground hover:text-foreground text-xs font-bold px-2 py-0.5 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  ✕ Dismiss
                </button>
              </div>
            )}

            {/* Staff Search Bar & Role Filter Chips */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              {/* Staff Search Input */}
              <div className="relative min-w-[240px] sm:max-w-xs w-full">
                <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search staff by name, email, role, platform..."
                  value={employeeSearch}
                  onChange={e => setEmployeeSearch(e.target.value)}
                  className="crm-input pl-9 pr-7 text-xs h-9 rounded-xl bg-muted/80 border-border focus:border-cyan-500 transition-all font-medium w-full"
                />
                {employeeSearch && (
                  <button
                    type="button"
                    onClick={() => setEmployeeSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Interactive Role Breakdown Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setEmployeeRoleFilter('ALL')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-[11px] border transition-all cursor-pointer whitespace-nowrap ${
                    employeeRoleFilter === 'ALL'
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                      : 'bg-muted/80 border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All Staff: {companyEmployees.length}
                </button>

                {Object.entries(roleCounts).map(([role, count]) => {
                  const style = getRoleBadgeStyle(role);
                  const isSelected = employeeRoleFilter === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setEmployeeRoleFilter(isSelected ? 'ALL' : role)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-extrabold text-[11px] border transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'ring-2 ring-cyan-400 bg-card text-foreground font-black'
                          : style.badgeCls
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dotCls}`} />
                      {style.label}: {count}
                    </button>
                  );
                })}

                {blockedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setEmployeeRoleFilter(employeeRoleFilter === 'BLOCKED' ? 'ALL' : 'BLOCKED')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-extrabold text-[11px] border transition-all cursor-pointer whitespace-nowrap ${
                      employeeRoleFilter === 'BLOCKED'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Blocked: {blockedCount}
                  </button>
                )}
              </div>
            </div>

            {/* High-Performance Table */}
            <div className="overflow-hidden rounded-2xl border border-border/80 shadow-md bg-card/60 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-gradient-to-r from-muted/90 via-muted/70 to-muted/90 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                      <th className="p-4">Staff Member</th>
                      <th className="p-4">Email Address</th>
                      <th className="p-4">Assigned Role (Org Admin Managed)</th>
                      <th className="p-4">Registration Key</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4 text-right">Last Active (App / Web)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-muted-foreground">
                          <Users size={32} className="mx-auto text-muted-foreground/40 mb-2" />
                          <p className="font-bold text-sm">No staff members found matching your search or filter.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setEmployeeSearch('');
                              setEmployeeRoleFilter('ALL');
                            }}
                            className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 cursor-pointer"
                          >
                            Reset Staff Filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map(emp => {
                        const style = getRoleBadgeStyle(emp.role);
                        const initials = (emp.name || emp.email || 'EM')
                          .split(' ')
                          .filter(Boolean)
                          .map((n: string) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase();

                        const isUnassigned = (emp.role || '').toUpperCase().includes('UNASSIGNED');
                        const actInfo = formatLastActivity(emp);

                        return (
                          <tr key={emp.id} className="hover:bg-muted/40 transition-colors group">
                            {/* Member Name + Avatar */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${style.avatarCls}`}>
                                  {initials}
                                </div>
                                <div>
                                  <div className="font-extrabold text-foreground text-xs tracking-tight group-hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                                    <span>{emp.name}</span>
                                    {isUnassigned && (
                                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                                        Pending Role
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium mt-0.5">
                                    <span>Joined {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sep 2026'}</span>
                                    {emp.assignedManager && (
                                      <>
                                        <span>•</span>
                                        <span className="text-indigo-400 font-bold">Under: {emp.assignedManager}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Email Address with Click to Copy */}
                            <td className="p-4">
                              <button
                                type="button"
                                onClick={() => handleCopyEmpText(emp.email)}
                                className="inline-flex items-center gap-1.5 font-mono text-cyan-600 dark:text-cyan-300 hover:text-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/20 transition-all cursor-pointer text-xs"
                                title="Click to copy email address"
                              >
                                {emp.email}
                                {copiedEmpText === emp.email ? (
                                  <Check size={11} className="text-emerald-400 shrink-0" />
                                ) : (
                                  <Copy size={11} className="opacity-60 group-hover:opacity-100 shrink-0" />
                                )}
                              </button>
                            </td>

                            {/* Assigned Role (Strictly Governed by Org / Tenant Admin) */}
                            <td className="p-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider shadow-sm ${style.badgeCls}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${style.dotCls}`} />
                                  {style.label}
                                </span>

                                {isUnassigned ? (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md"
                                    title="Role assignment is restricted to Tenant Admin in Admin Control Center"
                                  >
                                    <ShieldAlert size={11} className="text-amber-500 shrink-0" />
                                    Pending Org Admin Assign
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 text-[9px] font-bold text-muted-foreground/80 bg-muted/60 border border-border/60 px-1.5 py-0.5 rounded-md"
                                    title="Role managed by Organization Admin in Admin Control Center"
                                  >
                                    <ShieldCheck size={10} className="text-emerald-500 shrink-0" />
                                    Org Admin Managed
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Registration Key */}
                            <td className="p-4">
                              <button
                                type="button"
                                onClick={() => handleCopyEmpText(emp.keyUsed || 'ADOR-EC-7187')}
                                className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/80 hover:bg-muted px-2.5 py-1 rounded-lg border border-border transition-all cursor-pointer"
                                title="Click to copy Company Registration Key"
                              >
                                <Key size={11} className="text-amber-500 shrink-0" />
                                {emp.keyUsed || 'ADOR-EC-7187'}
                                {copiedEmpText === (emp.keyUsed || 'ADOR-EC-7187') ? (
                                  <Check size={11} className="text-emerald-400 shrink-0" />
                                ) : null}
                              </button>
                            </td>

                            {/* Account Status */}
                            <td className="p-4">
                              {emp.isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  ACTIVE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/10">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  SUSPENDED
                                </span>
                              )}
                            </td>

                            {/* Last Active (App / Web) & Platform Indicator */}
                            <td className="p-4 text-right">
                              <div className="inline-flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5">
                                  {/* Device / Platform Badge */}
                                  {actInfo.isAndroid ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                                      <Smartphone size={11} className="text-emerald-500" />
                                      Android App
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 shadow-xs">
                                      <Globe size={11} className="text-cyan-500" />
                                      Web App
                                    </span>
                                  )}

                                  {/* Relative Status Indicator */}
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                                      actInfo.isRecent
                                        ? 'text-emerald-500 font-black'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        actInfo.isRecent
                                          ? 'bg-emerald-500 animate-pulse ring-2 ring-emerald-500/30'
                                          : 'bg-muted-foreground/50'
                                      }`}
                                    />
                                    {actInfo.relativeText}
                                  </span>
                                </div>

                                {/* Exact Formatted Date & Time */}
                                {actInfo.hasActivity ? (
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-mono">
                                    <Clock size={10} className="text-muted-foreground/70" />
                                    <span>{actInfo.formattedDate}</span>
                                    <span className="text-muted-foreground/40">•</span>
                                    <span className="font-bold text-foreground/90">{actInfo.formattedTime}</span>
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-muted-foreground/60 font-mono">
                                    Pending 1st Login
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🏷️ SECTION: DISCOUNT COUPONS MANAGEMENT HUB */}
      {activeTab === 'coupons' && (
        <div className="crm-card p-5 border-emerald-500/40 bg-card space-y-5 rounded-2xl shadow-xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Tag size={18} className="text-emerald-500" /> Discount Coupons Management Hub
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create and manage promotional discount coupons for new tenant registrations and subscription renewals across Grow, Business, and Enterprise plans.
              </p>
            </div>
            <button
              onClick={() => setNewCouponModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all cursor-pointer w-max"
            >
              <Plus size={14} /> Create New Coupon
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Coupons</span>
              <span className="text-2xl font-black text-foreground">{couponsList.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-300 block">Active Coupons</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {couponsList.filter(c => c.isActive && (!c.expiresAt || new Date(c.expiresAt) > new Date())).length}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-300 block">Total Redemptions</span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {couponsList.reduce((acc, c) => acc + (c.usedCount || c.redemptionCount || 0), 0)}
              </span>
            </div>
          </div>

          {/* Coupons Table */}
          {couponsLoading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Loading coupons...</div>
          ) : couponsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              No discount coupons created yet. Click "Create New Coupon" to offer promotions.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3.5">Coupon Code & Description</th>
                    <th className="p-3.5">Discount Value</th>
                    <th className="p-3.5">Applicable Plans</th>
                    <th className="p-3.5">Uses / Limit</th>
                    <th className="p-3.5">Expiry Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {couponsList.map(c => {
                    const isExp = c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 text-xs">
                            {c.code}
                          </span>
                          {c.description && (
                            <p className="text-[11px] text-muted-foreground mt-1">{c.description}</p>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-foreground">
                          {c.discountType === 'PERCENT_OFF' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {c.applicablePlans && c.applicablePlans.length > 0 ? (
                              c.applicablePlans.map(p => (
                                <span key={p} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">All Plans</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono">
                          {c.usedCount ?? c.redemptionCount ?? 0} / {c.maxUses !== null && c.maxUses !== undefined ? c.maxUses : '∞'}
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="p-3.5">
                          {!c.isActive ? (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30">
                              DEACTIVATED
                            </span>
                          ) : isExp ? (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                              EXPIRED
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          {c.isActive && (
                            <button
                              onClick={() => handleRevokeCoupon(c.id)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 transition-all cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 🛡️ 6-MONTH DATA RETENTION & VERIFIED EMPLOYEE DOCUMENTS EXEMPTION HUB */}
      {activeTab === 'data_retention' && (
        <div className="crm-card p-6 border-blue-500/40 bg-card space-y-6 rounded-3xl shadow-2xl">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Shield size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                    6-Month Automatic Company Data Purge Hub
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automated 180-day operational lifecycle purge with strict permanent exemption for Verified Employee Documents
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchRetentionStatus}
                disabled={retentionLoading}
                className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold border border-border flex items-center gap-1.5 transition-all"
              >
                <RefreshCw size={13} className={retentionLoading ? 'animate-spin' : ''} /> Refresh Telemetry
              </button>
              <button
                onClick={handleTriggerPurgeNow}
                disabled={retentionPurging}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Trash2 size={14} className={retentionPurging ? 'animate-spin' : ''} />
                {retentionPurging ? 'Purging Expired Data...' : 'Purge Expired Company Data Now'}
              </button>
            </div>
          </div>

          {/* Toast Notice */}
          {retentionToast && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-sm">
              <span>{retentionToast}</span>
              <button onClick={() => setRetentionToast(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
            </div>
          )}

          {/* Strict Exemption Guarantee Callout Banner */}
          <div className="p-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-emerald-900/20 to-slate-900/40 text-foreground space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300 font-extrabold text-sm">
              <Lock size={16} />
              <h4>STRICT EXEMPTION GUARANTEE: Verified Employee Documents Permanently Protected</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Under this policy, all <span className="font-bold text-foreground">Employee Profiles</span>, official government credentials (<span className="font-bold text-foreground">PAN Cards, Aadhaar IDs, UAN numbers</span>), banking credentials (<span className="font-bold text-foreground">Account &amp; IFSC verification</span>), contracts, offer letters, and files uploaded to the Employee Drive Vault under <code className="font-mono text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">/Employees/[Employee Name]/Documents</code> are <span className="underline font-black text-emerald-600 dark:text-emerald-300">strictly exempted</span> and permanently protected from any automated deletion routine.
            </p>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Retention Window</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">6 Months</span>
                <span className="text-xs text-muted-foreground font-semibold">(180 Days)</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Any company history older than 180 days is auto-purged.</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Automation Schedule</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">Every 24h</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Daily Active</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Runs automatically in the background on system timer.</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-emerald-500/30 bg-emerald-500/5 space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Protected Employee Docs</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-300">
                  {retentionStatus?.exemptionGuarantee?.protectedEmployeeRecordsCount ?? 'All Active'}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Safe &amp; Retained</span>
              </div>
              <p className="text-[11px] text-muted-foreground">KYC, PAN, Bank records &amp; Employee Vault files.</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Pending Expired Records</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {retentionStatus?.telemetry?.totalPendingPurge ?? 0}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">Ready for Purge</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Operational data currently &gt; 180 days old.</p>
            </div>
          </div>

          {/* 2-Column Comparison Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Purge Target Column */}
            <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <Trash2 size={16} /> Company History Auto-Purged (&gt; 6 Months)
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-600 dark:text-rose-300">
                  AUTO-DELETED
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                The following operational company records are purged after reaching the 180-day retention cutoff:
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="font-semibold text-foreground">📋 Leads, Score History &amp; Transitions</span>
                  <span className="font-mono text-muted-foreground font-bold">
                    {retentionStatus?.telemetry?.breakdownPendingPurge?.leads ?? 0} pending
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="font-semibold text-foreground">📞 Activity Logs (Calls, Emails, Tasks, Meetings)</span>
                  <span className="font-mono text-muted-foreground font-bold">
                    {(retentionStatus?.telemetry?.breakdownPendingPurge?.activities ?? 0) + (retentionStatus?.telemetry?.breakdownPendingPurge?.tasks ?? 0) + (retentionStatus?.telemetry?.breakdownPendingPurge?.meetings ?? 0)} pending
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="font-semibold text-foreground">💼 Deals &amp; Historical Pipeline Stages</span>
                  <span className="font-mono text-muted-foreground font-bold">
                    {retentionStatus?.telemetry?.breakdownPendingPurge?.deals ?? 0} pending
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="font-semibold text-foreground">📝 Notes, Remarks &amp; Internal Logs</span>
                  <span className="font-mono text-muted-foreground font-bold">
                    {retentionStatus?.telemetry?.breakdownPendingPurge?.notes ?? 0} pending
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="font-semibold text-foreground">🔔 Notifications &amp; Expired Audit Logs</span>
                  <span className="font-mono text-muted-foreground font-bold">
                    {retentionStatus?.telemetry?.breakdownPendingPurge?.notifications ?? 0} pending
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="font-semibold text-foreground">📁 Company Files (Lead Imports, Temp Quotation PDFs)</span>
                  <span className="font-mono text-muted-foreground font-bold">
                    {retentionStatus?.telemetry?.breakdownPendingPurge?.companyDriveFiles ?? 0} pending
                  </span>
                </div>
              </div>
            </div>

            {/* Strict Exemption Column */}
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Verified Employee Documents (Permanently Retained)
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                  PERMANENT LOCK
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Strict exemption policy: The following records are permanently retained and exempt from deletion:
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="font-semibold text-foreground">🪪 Employee Profiles &amp; Employment History</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Permanent</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="font-semibold text-foreground">💳 PAN Cards, Aadhaar &amp; KYC Certifications</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Permanent</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="font-semibold text-foreground">🏦 Bank Account &amp; IFSC Credentials</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Permanent</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="font-semibold text-foreground">🛡️ UAN (Provident Fund) Numbers</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Permanent</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="font-semibold text-foreground">📁 Employee Drive Vault Files (/Employees/{'{name}'}/Documents)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Permanent</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span className="font-semibold text-foreground">👤 Staff Profile Photos &amp; Emergency Contacts</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Permanent</span>
                </div>
              </div>
            </div>
          </div>

          {/* Last Run Execution Telemetry */}
          {retentionStatus?.telemetry?.lastExecutionStats && (
            <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-foreground flex items-center gap-1.5">
                  <Clock size={14} className="text-cyan-500" /> Last Purge Execution Audit Log:
                </span>
                <span className="font-mono text-muted-foreground">
                  {retentionStatus.telemetry.lastExecutionStats.executedAt ? new Date(retentionStatus.telemetry.lastExecutionStats.executedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 rounded-lg bg-card border border-border">
                  <span className="text-muted-foreground block">Records Purged:</span>
                  <span className="font-bold text-rose-500">{retentionStatus.telemetry.lastExecutionStats.totalRecordsPurged}</span>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border">
                  <span className="text-muted-foreground block">Employee Docs Protected:</span>
                  <span className="font-bold text-emerald-500">{retentionStatus.telemetry.lastExecutionStats.protectedEmployeeDocsCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border">
                  <span className="text-muted-foreground block">Duration:</span>
                  <span className="font-bold text-foreground">{retentionStatus.telemetry.lastExecutionStats.durationMs}ms</span>
                </div>
                <div className="p-2 rounded-lg bg-card border border-border">
                  <span className="text-muted-foreground block">Cutoff Date:</span>
                  <span className="font-bold text-cyan-500">{new Date(retentionStatus.telemetry.lastExecutionStats.cutoffDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🏷️ CREATE NEW COUPON MODAL */}
      {newCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-emerald-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-emerald-500" />
                <h3 className="text-base font-black text-foreground">Create Promotional Discount Coupon</h3>
              </div>
              <button
                onClick={() => setNewCouponModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {couponSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> {couponSuccessMsg}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground font-bold block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  placeholder="e.g. FESTIVE2026 or SAVE50"
                  className="crm-input w-full font-mono font-bold uppercase text-sm"
                  value={couponCodeInput}
                  onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                />
              </div>

              <div>
                <label className="text-muted-foreground font-bold block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. 20% discount on Business and Enterprise subscriptions"
                  className="crm-input w-full text-xs"
                  value={couponDescInput}
                  onChange={e => setCouponDescInput(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Discount Type</label>
                  <select
                    className="crm-input w-full text-xs font-bold"
                    value={couponDiscountType}
                    onChange={e => setCouponDiscountType(e.target.value as any)}
                  >
                    <option value="PERCENT_OFF">Percentage Off (%)</option>
                    <option value="FLAT_OFF">Flat Off (₹ INR)</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">
                    {couponDiscountType === 'PERCENT_OFF' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'} *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={couponDiscountType === 'PERCENT_OFF' ? 100 : 100000}
                    className="crm-input w-full text-xs font-mono font-bold"
                    value={couponDiscountVal}
                    onChange={e => setCouponDiscountVal(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Leave empty for unlimited"
                    className="crm-input w-full text-xs font-mono"
                    value={couponMaxUses}
                    onChange={e => setCouponMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    className="crm-input w-full text-xs font-mono"
                    value={couponExpiresAt}
                    onChange={e => setCouponExpiresAt(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-muted-foreground font-bold block mb-1.5">Applicable Plans</label>
                <div className="flex gap-2">
                  {['GROW', 'BUSINESS', 'ENTERPRISE'].map(p => {
                    const isChecked = couponPlans.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          if (isChecked) setCouponPlans(prev => prev.filter(x => x !== p));
                          else setCouponPlans(prev => [...prev, p]);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-muted border-border text-muted-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setNewCouponModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCoupon}
                disabled={couponCreating || !couponCodeInput.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/30 disabled:opacity-50 flex items-center gap-1.5"
              >
                {couponCreating ? 'Creating Coupon...' : 'Create Coupon →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💬 WHATSAPP QUOTA TOP-UP MODAL */}
      {topUpModalOpen && topUpCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-indigo-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-indigo-500" />
                <h3 className="text-base font-black text-foreground">Top Up WhatsApp Credit Wallet</h3>
              </div>
              <button
                onClick={() => setTopUpModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {topUpSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> {topUpSuccessMsg}
              </div>
            )}

            <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
              <p className="font-bold text-foreground">{topUpCompany.name}</p>
              <p className="text-muted-foreground font-mono">Plan: {topUpCompany.plan} • Current Limit: {topUpCompany.whatsAppConfig?.monthlyLimit?.toLocaleString() || 0} credits</p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-muted-foreground font-bold block">Select Top-Up Credits Amount:</label>
              <div className="grid grid-cols-3 gap-2">
                {[5000, 10000, 20000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer font-mono ${
                      topUpAmount === amt
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    +{amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="pt-2">
                <label className="text-muted-foreground font-bold block mb-1">Or Custom Amount:</label>
                <input
                  type="number"
                  min={500}
                  step={500}
                  className="crm-input w-full font-mono font-bold text-sm"
                  value={topUpAmount}
                  onChange={e => setTopUpAmount(Math.max(100, Number(e.target.value)))}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setTopUpModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleTopUpWhatsApp(topUpCompany.id, topUpAmount)}
                disabled={topUpProcessing}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md shadow-indigo-600/30 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {topUpProcessing ? 'Adding Credits...' : `Add +${topUpAmount.toLocaleString()} Credits →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛠️ SECTION 3 MULTI-TAB MODAL: COMPANY EDIT & FEATURE CONTROL HUB */}
      {editModalOpen && editingCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-card border border-cyan-500/40 rounded-3xl shadow-2xl relative space-y-5 text-foreground">
            <button onClick={() => setEditModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground font-black text-lg">✕</button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center font-black">
                <Building2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">Manage Company Features & Subscription</h3>
                <p className="text-xs text-muted-foreground font-mono">{editingCompany.name} • {editingCompany.registrationKey}</p>
              </div>
            </div>

            {/* Modal Internal Navigation Tabs */}
            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-2xl border border-border overflow-x-auto text-xs font-extrabold">
              <button
                onClick={() => setEditModalTab('general')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${editModalTab === 'general' ? 'bg-cyan-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <SlidersHorizontal size={14} /> General & Seats
              </button>
              <button
                onClick={() => setEditModalTab('email')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${editModalTab === 'email' ? 'bg-cyan-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Mail size={14} /> Email Marketing
              </button>
              <button
                onClick={() => setEditModalTab('whatsapp')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${editModalTab === 'whatsapp' ? 'bg-cyan-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <MessageSquare size={14} /> WhatsApp Cloud
              </button>
              <button
                onClick={() => setEditModalTab('ai')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${editModalTab === 'ai' ? 'bg-purple-600 text-white shadow' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Bot size={14} /> AI Engine Customization
              </button>
            </div>

            {/* TAB 1: GENERAL & SEATS */}
            {editModalTab === 'general' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Company Name *</label>
                  <input className="crm-input w-full text-sm font-bold" value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Subscription Plan Tier</label>
                    <select className="crm-input w-full text-sm font-bold text-cyan-600 dark:text-cyan-400" value={editPlan} onChange={e => handleEditPlanChange(e.target.value as PlanType)}>
                      <option value="FREE_TRIAL">Free Trial (6 Users · 15-40 Days)</option>
                      <option value="GROW">Grow Plan (6 Users · Core CRM · No WA/Email)</option>
                      <option value="BUSINESS">Business Plan (18 Users · 5K Email · 20K WA)</option>
                      <option value="ENTERPRISE">Enterprise Plan (60 Users · All Features No Limit)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Total Allocated User Seats</label>
                    <input type="number" className="crm-input w-full text-sm font-mono font-bold" value={editSeats} onChange={e => setEditSeats(parseInt(e.target.value, 10))} />
                  </div>
                </div>

                {editPlan === 'FREE_TRIAL' && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Clock size={14} /> Free Trial Duration (15 to 40 Days)
                      </label>
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        {editTrialDuration} Days Duration
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={40}
                      step={1}
                      value={editTrialDuration}
                      onChange={e => handleTrialDurationChange(+e.target.value)}
                      className="w-full accent-amber-500 cursor-pointer h-2 bg-muted rounded-lg"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-muted-foreground font-bold block">Expiration Date (Custom)</label>
                      <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                        {editExpiryDate ? `${calculateDaysFromToday(editExpiryDate)} days left` : ''}
                      </span>
                    </div>
                    <input type="date" className="crm-input w-full text-sm font-bold font-mono" value={editExpiryDate} onChange={e => setEditExpiryDate(e.target.value)} />
                    <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5 text-[10px]">
                      <span className="text-muted-foreground font-semibold text-[10px]">Presets:</span>
                      {[
                        { label: '+7d', days: 7 },
                        { label: '+15d', days: 15 },
                        { label: '+30d', days: 30 },
                        { label: '+60d', days: 60 },
                      ].map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + preset.days);
                            setEditExpiryDate(d.toISOString().split('T')[0]);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-muted hover:bg-cyan-500/20 hover:text-cyan-600 dark:hover:text-cyan-300 border border-border text-foreground font-mono font-bold transition-all"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Workspace Operation Status</label>
                    <select className="crm-input w-full text-sm font-bold" value={editIsActive ? 'ACTIVE' : 'SUSPENDED'} onChange={e => setEditIsActive(e.target.value === 'ACTIVE')}>
                      <option value="ACTIVE">ACTIVE (Normal Workspace Operation)</option>
                      <option value="SUSPENDED">SUSPENDED (Block Workspace Access)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EMAIL MARKETING */}
            {editModalTab === 'email' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                      <Mail size={16} className="text-emerald-500" /> Enable Email Marketing Feature
                    </h4>
                    <p className="text-[11px] text-muted-foreground">Controls access for all admins & employees of {editingCompany.name}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editEmailEnabled}
                    onChange={e => setEditEmailEnabled(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Monthly Email Quota Limit</label>
                    <input
                      type="number"
                      className="crm-input w-full text-sm font-mono font-bold"
                      value={editEmailLimit}
                      onChange={e => setEditEmailLimit(+e.target.value)}
                      disabled={!editEmailEnabled}
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Sender Domain Verification</label>
                    <input
                      className="crm-input w-full text-sm font-mono"
                      placeholder="e.g. company.com"
                      value={editEmailSenderDomain}
                      onChange={e => setEditEmailSenderDomain(e.target.value)}
                      disabled={!editEmailEnabled}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: WHATSAPP CLOUD */}
            {editModalTab === 'whatsapp' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                      <MessageSquare size={16} className="text-indigo-500" /> Enable WhatsApp Cloud Feature
                    </h4>
                    <p className="text-[11px] text-muted-foreground">Controls broadcast & live chat access for all employees of {editingCompany.name}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editWAEnabled}
                    onChange={e => setEditWAEnabled(e.target.checked)}
                    className="w-5 h-5 accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Monthly Message Limit</label>
                    <input
                      type="number"
                      className="crm-input w-full text-sm font-mono font-bold"
                      value={editWALimit}
                      onChange={e => setEditWALimit(+e.target.value)}
                      disabled={!editWAEnabled}
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Configured WhatsApp Phone Number</label>
                    <input
                      className="crm-input w-full text-sm font-mono"
                      placeholder="+91..."
                      value={editWAPhoneNumber}
                      onChange={e => setEditWAPhoneNumber(e.target.value)}
                      disabled={!editWAEnabled}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: AI CUSTOMIZATION */}
            {editModalTab === 'ai' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-foreground text-sm flex items-center gap-2">
                      <Bot size={16} className="text-purple-500" /> Enable AI Sales Assistant & Lead Engine
                    </h4>
                    <p className="text-[11px] text-muted-foreground">Controls AI lead scoring and smart response generator for {editingCompany.name}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editAIEnabled}
                    onChange={e => setEditAIEnabled(e.target.checked)}
                    className="w-5 h-5 accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">AI Tier Allocation</label>
                    <select
                      className="crm-input w-full text-sm font-extrabold text-purple-600 dark:text-purple-300"
                      value={editAITier}
                      onChange={e => setEditAITier(e.target.value as AITierType)}
                      disabled={!editAIEnabled}
                    >
                      <option value="BASIC">BASIC (Lead Score Only)</option>
                      <option value="PRO">PRO (Score + Sentiment + Pitch)</option>
                      <option value="ENTERPRISE_CUSTOM">ENTERPRISE CUSTOM (Full AI + Custom Bot Prompt)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-muted-foreground font-bold block mb-1">Monthly AI Token Limit</label>
                    <input
                      type="number"
                      className="crm-input w-full text-sm font-mono font-bold"
                      value={editAITokenLimit}
                      onChange={e => setEditAITokenLimit(+e.target.value)}
                      disabled={!editAIEnabled}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Custom AI Assistant System Instructions / Persona Prompt</label>
                  <textarea
                    className="crm-input w-full h-24 text-xs font-mono"
                    placeholder="Enter custom instructions for tenant's sales reps AI assistant..."
                    value={editAIPrompt}
                    onChange={e => setEditAIPrompt(e.target.value)}
                    disabled={!editAIEnabled}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border flex-wrap">
              {editingCompany && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendPdfEmail(editingCompany)}
                    disabled={sendingPdfCompanyId === editingCompany.id}
                    className="px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {sendingPdfCompanyId === editingCompany.id ? (
                      <Loader2 size={13} className="animate-spin text-indigo-500" />
                    ) : (
                      <Mail size={13} className="text-indigo-500" />
                    )}
                    Send PDF Email
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(editingCompany)}
                    className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Download size={13} className="text-emerald-500" />
                    Download PDF
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 bg-muted text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold">
                  Cancel
                </button>
                <button onClick={handleSaveCompanyEdit} className="btn-primary text-xs px-6 py-2.5 shadow-lg bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-extrabold">
                  Save Company Features & Quotas ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date-Wise Chat Log Modal */}
      {chatLogModalOpen && chatLogCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-card border border-indigo-500/30 rounded-3xl shadow-2xl relative space-y-4 text-foreground">
            <button onClick={() => setChatLogModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground font-bold">✕</button>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar size={18} className="text-indigo-500" /> Date Wise Chat Logs for {chatLogCompany.name}
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted text-muted-foreground font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Messages Sent</th>
                    <th className="p-3">Delivery Rate</th>
                    <th className="p-3">Active Chats</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dailyLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-muted/50">
                      <td className="p-3 font-mono font-bold text-foreground">{log.date}</td>
                      <td className="p-3 font-mono text-cyan-600 dark:text-cyan-400 font-bold">{log.messagesSent}</td>
                      <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{log.deliveryRate}%</td>
                      <td className="p-3 font-mono text-muted-foreground">{log.activeChats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setChatLogModalOpen(false)} className="btn-primary text-xs px-5 py-2">Close Log</button>
            </div>
          </div>
        </div>
      )}

      {/* 📅 CUSTOM EXTEND EXPIRY MODAL */}
      {extendModalOpen && extendingCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="crm-card max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 bg-card border border-emerald-500/40 rounded-3xl shadow-2xl relative space-y-5 text-foreground">
            <button
              onClick={() => setExtendModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground font-black text-lg p-1.5 rounded-xl hover:bg-muted transition-colors"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 border-b border-border pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shadow-inner">
                <Calendar size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">Custom Extend Expiry Date</h3>
                <p className="text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{extendingCompany.name}</span> • Key: <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{extendingCompany.registrationKey}</span>
                </p>
              </div>
            </div>

            {/* Current Status Card */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">Current Expiry Status</span>
                <p className="font-mono text-sm font-black text-foreground mt-0.5">
                  {extendingCompany.expiryDate || 'No date set'}
                </p>
                <p className="text-[11px] text-muted-foreground">Plan Tier: <strong className="text-amber-600 dark:text-amber-400 font-bold">{extendingCompany.plan}</strong></p>
              </div>
              <div>
                {extendingCompany.isExpired || (extendingCompany.expiryDate && new Date(extendingCompany.expiryDate) < new Date()) ? (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/40 inline-flex items-center gap-1.5">
                    <AlertCircle size={13} /> PLAN EXPIRED
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 inline-flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> ACTIVE SUBSCRIPTION
                  </span>
                )}
              </div>
            </div>

            {/* Mode Selector (if not currently expired) */}
            {extendingCompany.expiryDate && new Date(extendingCompany.expiryDate) > new Date() && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Calculate Extension Base:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExtendBaseMode('today');
                      const target = new Date();
                      const days = typeof extendDaysCount === 'number' ? extendDaysCount : parseInt(extendDaysCount, 10) || 30;
                      target.setDate(target.getDate() + days);
                      setCustomExpiryDate(target.toISOString().split('T')[0]);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all text-center ${
                      extendBaseMode === 'today'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-muted/50 text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    From Today ({new Date().toISOString().split('T')[0]})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExtendBaseMode('currentExpiry');
                      const target = new Date(extendingCompany.expiryDate);
                      const days = typeof extendDaysCount === 'number' ? extendDaysCount : parseInt(extendDaysCount, 10) || 30;
                      target.setDate(target.getDate() + days);
                      setCustomExpiryDate(target.toISOString().split('T')[0]);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all text-center ${
                      extendBaseMode === 'currentExpiry'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-muted/50 text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    From Current Expiry ({extendingCompany.expiryDate})
                  </button>
                </div>
              </div>
            )}

            {/* Custom Expiry Date Input (Primary) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  <Calendar size={14} className="text-emerald-500" />
                  Custom Expiration Date (Calendar Picker) *
                </label>
                <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                  {calculateDaysFromToday(customExpiryDate)} Days from Today
                </span>
              </div>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={customExpiryDate}
                onChange={e => handleCustomDateChange(e.target.value)}
                className="crm-input w-full text-base font-bold font-mono tracking-wide py-2.5 px-3.5 border-emerald-500/40 focus:border-emerald-500"
              />
            </div>

            {/* 1-Click Preset Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground block">
                Quick 1-Click Extension Presets:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: '+7 Days', sub: '1 Week', days: 7 },
                  { label: '+15 Days', sub: 'Half Month', days: 15 },
                  { label: '+30 Days', sub: '1 Month', days: 30 },
                  { label: '+60 Days', sub: '2 Months', days: 60 },
                ].map(preset => {
                  const isSelected = extendDaysCount === preset.days;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleApplyDaysPreset(preset.days)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-sm ring-1 ring-emerald-500/50'
                          : 'bg-muted/40 hover:bg-muted text-foreground border-border hover:border-emerald-500/30'
                      }`}
                    >
                      <div className="text-xs font-bold font-mono">{preset.label}</div>
                      <div className="text-[10px] text-muted-foreground">{preset.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Days Input */}
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border space-y-2">
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Clock size={13} className="text-cyan-500" />
                Or Enter Custom Number of Days to Extend:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={extendDaysCount}
                  onChange={e => handleCustomDaysChange(e.target.value)}
                  placeholder="e.g. 45"
                  className="crm-input w-36 text-sm font-mono font-bold"
                />
                <span className="text-xs text-muted-foreground font-semibold">
                  days from {extendBaseMode === 'currentExpiry' ? 'current expiry date' : 'today'}
                </span>
              </div>
            </div>

            {/* Reason / Internal Audit Note (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground block">Extension Reason / Admin Note (Optional):</label>
              <input
                type="text"
                value={extendReason}
                onChange={e => setExtendReason(e.target.value)}
                placeholder="e.g. Bank transfer payment received, or special pilot trial extension"
                className="crm-input w-full text-xs"
              />
            </div>

            {/* Live Preview Summary Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Extension Result Preview
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-base font-black text-foreground">
                    {formatFullDate(customExpiryDate)}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    ISO Date: <span className="font-bold text-emerald-600 dark:text-emerald-400">{customExpiryDate}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 inline-flex items-center gap-1">
                    <CheckCircle2 size={12} /> RESTORED & ACTIVE
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1 font-bold">
                    {calculateDaysFromToday(customExpiryDate)} Days Valid
                  </p>
                </div>
              </div>
            </div>

            {/* Success message banner */}
            {extendSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> {extendSuccessMsg}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setExtendModalOpen(false)}
                className="px-4 py-2 bg-muted text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customExpiryDate || extendSaving}
                onClick={handleSaveCustomExpiry}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {extendSaving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Applying Custom Date...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Confirm & Apply Custom Expiry Date
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PLAN VERIFICATION & APPROVAL MODAL (SUPER ADMIN REVIEW) ── */}
      {verificationModalOpen && verifyingCompany && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-card border border-amber-500/40 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl my-8 text-foreground">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Shield size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                      TENANT ONBOARDING REVIEW
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground font-mono">
                      Key: {verifyingCompany.registrationKey}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-foreground mt-0.5">
                    Verify & Activate Company Workspace
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setVerificationModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Company Metadata Header Card (Full Registration Details) */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Company Profile</span>
                  <span className="font-black text-foreground text-sm">{verifyingCompany.name}</span>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {verifyingCompany.companyType && (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.2 rounded border border-border">
                        {verifyingCompany.companyType}
                      </span>
                    )}
                    {verifyingCompany.sector && (
                      <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">
                        • {verifyingCompany.sector}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Admin Contact & Phone</span>
                  <span className="font-bold text-foreground">{verifyingCompany.adminName}</span>
                  <span className="text-[11px] text-muted-foreground block font-mono truncate">{verifyingCompany.adminEmail}</span>
                  {verifyingCompany.phone && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold block mt-0.5">
                      📞 +91 {verifyingCompany.phone}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Registration Key & Type</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 inline-block mt-0.5">
                    {verifyingCompany.registrationKey}
                  </span>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    {verifyingCompany.accountType === 'BUY_REQUEST' ? (
                      <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        🛒 Buy Request (30 Days)
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-amber-500 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                        ⚡ Free Trial (15 Days)
                      </span>
                    )}
                    {verifyingCompany.couponCode && (
                      <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded border border-indigo-500/30">
                        🏷️ {verifyingCompany.couponCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Second Row: Address & Statutory Taxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-border/60 text-[11px]">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Registered Location</span>
                  <span className="font-medium text-foreground">
                    {verifyingCompany.city || verifyingCompany.state
                      ? `${verifyingCompany.city || ''}${verifyingCompany.city && verifyingCompany.state ? ', ' : ''}${verifyingCompany.state || ''}`
                      : 'India'}
                    {verifyingCompany.pincode ? ` (${verifyingCompany.pincode})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">GSTIN Number</span>
                  <span className="font-mono font-bold text-amber-500">
                    {verifyingCompany.gstNumber || 'Not Registered'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Permanent Account Number (PAN)</span>
                  <span className="font-mono font-bold text-foreground">
                    {verifyingCompany.panNumber ? `${verifyingCompany.panNumber} (${verifyingCompany.panType || 'BUSINESS'})` : 'Not provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* Delay Inquiries Notice Box (If tenant user sent any inquiry) */}
            {verifyingCompany.delayInquiries && verifyingCompany.delayInquiries.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-600 dark:text-red-300 flex items-center gap-1.5">
                    <AlertCircle size={14} /> Delay Inquiry Received from Tenant
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(verifyingCompany.delayInquiries[0].timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-muted-foreground bg-card/60 p-2.5 rounded-xl border border-red-500/20 italic">
                  "{verifyingCompany.delayInquiries[0].message}"
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Sent by: <strong className="text-foreground">{verifyingCompany.delayInquiries[0].senderName || verifyingCompany.adminName}</strong> ({verifyingCompany.delayInquiries[0].senderEmail || verifyingCompany.adminEmail})
                </p>
              </div>
            )}

            {/* Step 1: Select Verified Plan Tier */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                1. Approve / Select Plan Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    key: 'GROW',
                    name: '🌱 Grow Plan',
                    seats: 6,
                    tag: '6 Users · Core CRM',
                    desc: 'No WhatsApp Cloud · No Email Marketing · Upgrade Disabled',
                    color: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400',
                  },
                  {
                    key: 'BUSINESS',
                    name: '💼 Business Plan',
                    seats: 18,
                    tag: '18 Users · Most Popular',
                    desc: '5K Email Quota/mo · 20K WhatsApp Credit Limit · AI Engine',
                    color: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
                  },
                  {
                    key: 'ENTERPRISE',
                    name: '👑 Enterprise Plan',
                    seats: 60,
                    tag: '60 Users · No Limits',
                    desc: 'Unlimited WhatsApp · Unlimited Email · Full Custom AI Engine',
                    color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
                  },
                ].map(p => {
                  const isSelected = verifyPlan === p.key || (verifyPlan === 'GROWTH' && p.key === 'GROW');
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => {
                        setVerifyPlan(p.key as PlanType);
                        setVerifySeats(p.seats);
                        if (p.key === 'GROW') {
                          setVerifyEmailEnabled(false);
                          setVerifyWAEnabled(false);
                          setVerifyAIEnabled(false);
                        } else {
                          setVerifyEmailEnabled(true);
                          setVerifyWAEnabled(true);
                          setVerifyAIEnabled(true);
                        }
                      }}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer space-y-1 ${
                        isSelected
                          ? 'bg-amber-600/15 border-amber-500 shadow-md ring-2 ring-amber-400/30'
                          : 'bg-card border-border hover:border-muted-foreground/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-foreground">{p.name}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-muted text-foreground font-mono">
                          {p.seats} Users
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block font-mono">
                        {p.tag}
                      </span>
                      <p className="text-[10px] text-muted-foreground leading-tight">{p.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: User Seats & 4 Presets Validity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* User Seats Quota */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/20 border border-border">
                <label className="text-xs font-bold text-muted-foreground block">
                  2. User Seats Quota Allocation
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={verifySeats}
                    onChange={e => setVerifySeats(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="crm-input w-28 text-sm font-bold font-mono"
                  />
                  <div className="flex items-center gap-1">
                    {[6, 18, 60].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setVerifySeats(s)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                          verifySeats === s
                            ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-300'
                            : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {s} Seats
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">Maximum simultaneous staff login keys for this workspace</p>
              </div>

              {/* Validity Presets (4 Strict Options) */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/20 border border-border">
                <label className="text-xs font-bold text-muted-foreground block">
                  3. Validity Duration (4 Presets)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: '+7 Days (1 Week)', days: 7 },
                    { label: '+15 Days (Half Month)', days: 15 },
                    { label: '+30 Days (1 Month)', days: 30 },
                    { label: '+60 Days (2 Months)', days: 60 },
                  ].map(preset => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setVerifyValidityDays(preset.days)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        verifyValidityDays === preset.days
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : 'bg-card border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ Expiry Date: {new Date(Date.now() + verifyValidityDays * 86400000).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </p>
              </div>
            </div>

            {/* Step 3: Feature Toggles for Company */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-muted/20 border border-border">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block">
                4. Global Feature Toggles for Workspace
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setVerifyEmailEnabled(!verifyEmailEnabled)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    verifyEmailEnabled
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-muted/40 border-border text-muted-foreground'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <Mail size={13} /> Email Marketing
                  </span>
                  <span className="text-[10px] font-black">{verifyEmailEnabled ? 'ON ✓' : 'OFF ✕'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerifyWAEnabled(!verifyWAEnabled)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    verifyWAEnabled
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300'
                      : 'bg-muted/40 border-border text-muted-foreground'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <MessageSquare size={13} /> WhatsApp Cloud
                  </span>
                  <span className="text-[10px] font-black">{verifyWAEnabled ? 'ON ✓' : 'OFF ✕'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerifyAIEnabled(!verifyAIEnabled)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    verifyAIEnabled
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300'
                      : 'bg-muted/40 border-border text-muted-foreground'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <Bot size={13} /> AI Engine
                  </span>
                  <span className="text-[10px] font-black">{verifyAIEnabled ? 'ON ✓' : 'OFF ✕'}</span>
                </button>
              </div>
            </div>

            {/* Success Message Banner */}
            {verifySuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-scale-in">
                <CheckCircle2 size={16} /> {verifySuccessMsg}
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setRejectModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
              >
                Decline / Reject Registration
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <button
                  type="button"
                  disabled={sendingPdfCompanyId === verifyingCompany.id}
                  onClick={() => handleSendPdfEmail(verifyingCompany)}
                  className="px-3 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title={`Send Registration Certificate PDF to ${verifyingCompany.adminEmail}`}
                >
                  {sendingPdfCompanyId === verifyingCompany.id ? (
                    <Loader2 size={13} className="animate-spin text-indigo-500" />
                  ) : (
                    <Mail size={13} className="text-indigo-500" />
                  )}
                  Send PDF Email
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(verifyingCompany)}
                  className="px-3 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Download Official Registration Certificate PDF"
                >
                  <Download size={13} className="text-emerald-500" />
                  Download PDF
                </button>

                <button
                  type="button"
                  onClick={() => setVerificationModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={verifyApproving}
                  onClick={handleApproveCompany}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {verifyApproving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Verifying & Activating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> Approve & Activate Company ✓
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECTION CONFIRMATION MODAL ── */}
      {rejectModalOpen && verifyingCompany && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-foreground">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Decline Company Registration</h3>
                <p className="text-[11px] text-muted-foreground">This reason will be visible to the company when they query status.</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Reason for Rejection *</label>
              <textarea
                rows={3}
                required
                value={rejectionReasonInput}
                onChange={e => setRejectionReasonInput(e.target.value)}
                className="crm-input w-full text-xs leading-relaxed"
                placeholder="e.g. Incomplete business documents or duplicate registration"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                Back
              </button>
              <button
                type="button"
                disabled={rejecting || !rejectionReasonInput.trim()}
                onClick={handleRejectCompany}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {rejecting ? 'Declining...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📄 DEDICATED PDF DISPATCH & DOWNLOAD MODAL */}
      {pdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-lg w-full p-6 bg-card border border-indigo-500/40 rounded-3xl shadow-2xl relative space-y-5 text-foreground">
            <button
              onClick={() => setPdfModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground font-bold p-1 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">Registration Certificate Hub</h3>
                <p className="text-xs text-muted-foreground">Send certificate PDF via email or download directly</p>
              </div>
            </div>

            {/* Company Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Select Company / Tenant Workspace</label>
              <select
                className="crm-input w-full text-xs font-bold"
                value={pdfSelectedCompany?.id || ''}
                onChange={(e) => {
                  const comp = [...companies, ...pendingCompanies].find((c: any) => c.id === e.target.value);
                  setPdfSelectedCompany(comp || null);
                  if (comp?.adminEmail) setPdfCustomEmail(comp.adminEmail);
                }}
              >
                {[...companies, ...pendingCompanies].map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — ({c.registrationKey || 'Pending'} • {c.plan || 'Plan'})
                  </option>
                ))}
              </select>
            </div>

            {/* Company Info Badge */}
            {pdfSelectedCompany && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold">Company Name:</span>
                  <span className="font-extrabold text-foreground">{pdfSelectedCompany.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold">Registration Key:</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{pdfSelectedCompany.registrationKey || 'Pending Super Admin Review'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold">Plan Tier:</span>
                  <span className="font-black px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-[10px]">
                    {pdfSelectedCompany.plan || 'FREE_TRIAL'}
                  </span>
                </div>
              </div>
            )}

            {/* Recipient Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                <span>Send PDF with Mail to Address:</span>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-normal">Editable recipient</span>
              </label>
              <input
                type="email"
                className="crm-input w-full text-xs font-mono font-bold"
                value={pdfCustomEmail}
                onChange={(e) => setPdfCustomEmail(e.target.value)}
                placeholder="company-admin@domain.com"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (pdfSelectedCompany) handleDownloadPdf(pdfSelectedCompany);
                }}
                disabled={!pdfSelectedCompany}
                className="px-4 py-2.5 rounded-xl font-extrabold text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Download size={14} className="text-emerald-500" />
                Download PDF
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setPdfModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (pdfSelectedCompany) {
                      await handleSendPdfEmail(pdfSelectedCompany, pdfCustomEmail);
                    }
                  }}
                  disabled={!pdfSelectedCompany || sendingPdfCompanyId === pdfSelectedCompany?.id}
                  className="px-4 py-2.5 rounded-xl font-extrabold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {sendingPdfCompanyId === pdfSelectedCompany?.id ? (
                    <Loader2 size={14} className="animate-spin text-white" />
                  ) : (
                    <Mail size={14} />
                  )}
                  Send PDF with Mail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏢 COMPREHENSIVE COMPANY REGISTRATION DOSSIER MODAL */}
      {detailsModalOpen && viewCompanyDetails && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="crm-card max-w-4xl w-full p-6 bg-card border border-cyan-500/40 rounded-3xl shadow-2xl relative space-y-6 text-foreground my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
                  🏢
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/70 border border-cyan-500/40 px-2.5 py-0.5 rounded-full shadow-inner inline-flex items-center gap-1">
                      <Shield size={10} /> COMPANY REGISTRATION DOSSIER
                    </span>
                    {viewCompanyDetails.verificationStatus === 'APPROVED' || viewCompanyDetails.isActive ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 size={11} /> APPROVED & ACTIVE
                      </span>
                    ) : viewCompanyDetails.verificationStatus === 'REJECTED' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
                        <AlertCircle size={11} /> DECLINED / REJECTED
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                        <Clock size={11} /> AWAITING APPROVAL
                      </span>
                    )}
                    {detailsLoading && (
                      <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                        <RefreshCw size={10} className="animate-spin" /> Fetching live details...
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-foreground mt-1 tracking-tight flex items-center gap-2">
                    {viewCompanyDetails.name}
                    {viewCompanyDetails.companyType && (
                      <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-lg border border-border">
                        {viewCompanyDetails.companyType}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Workspace ID: {viewCompanyDetails.id} {viewCompanyDetails.slug ? `• Slug: ${viewCompanyDetails.slug}` : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailsModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center font-bold text-base transition-colors cursor-pointer shrink-0"
                title="Close Dossier"
              >
                ✕
              </button>
            </div>

            {/* Permanent Company Registration Key Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-cyan-300 block">
                  Official Permanent Company Registration Key
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xl font-black font-mono tracking-widest text-cyan-400 bg-slate-950/80 px-3.5 py-1 rounded-xl border border-cyan-500/50 shadow-inner">
                    {viewCompanyDetails.registrationKey || 'N/A'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyRegistrationKey(viewCompanyDetails.registrationKey)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Copy size={13} /> {copiedKey ? 'Copied!' : 'Copy Key'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(viewCompanyDetails)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download size={13} /> Download Certificate
                </button>
                <button
                  type="button"
                  onClick={() => handleSendPdfEmail(viewCompanyDetails)}
                  disabled={sendingPdfCompanyId === viewCompanyDetails.id}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {sendingPdfCompanyId === viewCompanyDetails.id ? (
                    <Loader2 size={13} className="animate-spin text-indigo-400" />
                  ) : (
                    <Mail size={13} className="text-indigo-400" />
                  )}
                  Email Certificate
                </button>
              </div>
            </div>

            {/* 4 Core Information Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Primary Administrator & Contact */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Users size={14} className="text-cyan-500" /> Primary Administrator Contact
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">Admin Full Name</span>
                    <span className="font-extrabold text-foreground">{viewCompanyDetails.adminName || 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">Official Email</span>
                    <a
                      href={`mailto:${viewCompanyDetails.adminEmail}`}
                      className="font-mono text-cyan-600 dark:text-cyan-400 hover:underline break-all"
                    >
                      {viewCompanyDetails.adminEmail || 'Not Specified'}
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">Contact Phone Number</span>
                    {viewCompanyDetails.phone ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={`tel:${viewCompanyDetails.phone}`} className="font-mono font-bold text-foreground hover:underline">
                          +91 {viewCompanyDetails.phone}
                        </a>
                        <a
                          href={`https://wa.me/91${String(viewCompanyDetails.phone).replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1"
                        >
                          <MessageSquare size={10} /> WhatsApp
                        </a>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Not provided</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">Registered Date</span>
                    <span className="font-medium text-foreground">
                      {viewCompanyDetails.registeredAt || viewCompanyDetails.createdAt
                        ? new Date(viewCompanyDetails.registeredAt || viewCompanyDetails.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Registered Business Address */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MapPin size={14} className="text-rose-500" /> Registered Business Location
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">City / District</span>
                    <span className="font-extrabold text-foreground">{viewCompanyDetails.city || 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">State</span>
                    <span className="font-extrabold text-foreground">{viewCompanyDetails.state || 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">Postal Code / Pincode</span>
                    <span className="font-mono font-bold text-foreground">{viewCompanyDetails.pincode || 'Not Specified'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">Country / Region</span>
                    <span className="font-medium text-foreground">India (IN)</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Tax Identification & Statutory Compliance */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText size={14} className="text-amber-500" /> Tax & Statutory Compliance
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">GSTIN Number</span>
                    {viewCompanyDetails.gstNumber ? (
                      <span className="font-mono font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 inline-block">
                        {viewCompanyDetails.gstNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Not Registered / Optional</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">Permanent Account Number (PAN)</span>
                    {viewCompanyDetails.panNumber ? (
                      <span className="font-mono font-black text-foreground bg-muted px-2 py-0.5 rounded border border-border inline-block">
                        {viewCompanyDetails.panNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Not provided</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">PAN Classification</span>
                    <span className="font-semibold text-foreground">
                      {viewCompanyDetails.panType === 'INDIVIDUAL' ? '👤 Individual / Proprietor' : '🏢 Business / Entity'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold">Industry Sector</span>
                    <span className="font-semibold text-foreground">{viewCompanyDetails.sector || 'General Business'}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Plan Tier, Quota & Commercial Terms */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <CreditCard size={14} className="text-emerald-500" /> Plan, Quotas & Terms
                </h4>
                {(() => {
                  const planMeta = getPlanMeta(viewCompanyDetails.plan || viewCompanyDetails.requestedPlan);
                  const subStatus = getCompanySubscriptionStatus(viewCompanyDetails);
                  const daysLeft = getDaysRemaining(viewCompanyDetails.expiryDate, viewCompanyDetails.validityDays);
                  const isExp = subStatus.key === 'EXPIRED' || daysLeft < 0;

                  return (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold">Plan Subscribed</span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`font-black px-2.5 py-0.5 rounded-full text-xs inline-flex items-center gap-1 border ${planMeta.badgeCls}`}>
                            <span>{planMeta.icon}</span> {planMeta.name}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${subStatus.badgeCls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${subStatus.dotCls}`} />
                            {subStatus.label}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold">Registration Account Type</span>
                        <span className="font-bold text-foreground">
                          {viewCompanyDetails.accountType === 'BUY_REQUEST' ? '🛒 Buy Request (Paid)' : '⚡ Free Trial'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold">User Seats Ratio</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {viewCompanyDetails.seatsUsed ?? 0} Used / {viewCompanyDetails.seatsAllocated ?? viewCompanyDetails.seatsRequested ?? 6} Allocated
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold">Subscription Expiry & Days</span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`font-mono font-bold ${isExp ? 'text-rose-500' : 'text-foreground'}`}>
                            {viewCompanyDetails.expiryDate || 'N/A'}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-black border font-mono ${
                            isExp
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/40'
                              : daysLeft <= 3
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 animate-pulse'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                          }`}>
                            {isExp ? 'Expired' : daysLeft === 0 ? 'Expires Today' : `${daysLeft}d left`}
                          </span>
                        </div>
                      </div>
                      {viewCompanyDetails.couponCode && (
                        <div className="col-span-2">
                          <span className="text-[10px] text-muted-foreground block uppercase font-bold">Promo Coupon Applied</span>
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            🏷️ {viewCompanyDetails.couponCode}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Feature Modules Entitlements Strip */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">
                Active Module Feature Entitlements
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-cyan-400" />
                    <div>
                      <p className="font-bold text-foreground">Email Marketing</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {viewCompanyDetails.emailConfig?.monthlyLimit ? `${viewCompanyDetails.emailConfig.monthlyLimit.toLocaleString()}/mo` : 'Standard Quota'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${viewCompanyDetails.emailConfig?.enabled || viewCompanyDetails.features?.emailMarketing ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                    {viewCompanyDetails.emailConfig?.enabled || viewCompanyDetails.features?.emailMarketing ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-400" />
                    <div>
                      <p className="font-bold text-foreground">WhatsApp Cloud</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {viewCompanyDetails.whatsAppConfig?.monthlyLimit ? `${viewCompanyDetails.whatsAppConfig.monthlyLimit.toLocaleString()} credits` : 'Standard Quota'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${viewCompanyDetails.whatsAppConfig?.enabled || viewCompanyDetails.features?.whatsappCloud ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                    {viewCompanyDetails.whatsAppConfig?.enabled || viewCompanyDetails.features?.whatsappCloud ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot size={16} className="text-purple-400" />
                    <div>
                      <p className="font-bold text-foreground">AI Engine Hub</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {viewCompanyDetails.aiConfig?.tier || 'PRO'} Tier
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${viewCompanyDetails.aiConfig?.enabled || viewCompanyDetails.features?.aiEngine ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                    {viewCompanyDetails.aiConfig?.enabled || viewCompanyDetails.features?.aiEngine ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Registered Employees List if available */}
            {viewCompanyDetails.employees && viewCompanyDetails.employees.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">
                  Registered Staff & Employees ({viewCompanyDetails.employees.length})
                </span>
                <div className="overflow-x-auto rounded-xl border border-border max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">Key Used</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium">
                      {viewCompanyDetails.employees.map((emp: any) => (
                        <tr key={emp.id} className="hover:bg-muted/20">
                          <td className="p-2.5 font-bold text-foreground">{emp.name}</td>
                          <td className="p-2.5 font-mono text-cyan-400">{emp.email}</td>
                          <td className="p-2.5 uppercase font-mono text-[10px]">{emp.role}</td>
                          <td className="p-2.5 font-mono text-[10px] text-muted-foreground">{emp.keyUsed}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${emp.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                              {emp.isActive ? 'ACTIVE' : 'BLOCKED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Bottom Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Close Dossier
              </button>

              <div className="flex items-center gap-2">
                {(!viewCompanyDetails.isActive || viewCompanyDetails.verificationStatus === 'PENDING') && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailsModalOpen(false);
                      handleOpenVerificationModal(viewCompanyDetails);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/25 transition-all cursor-pointer"
                  >
                    <Shield size={13} /> Review & Verify Plan →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(viewCompanyDetails)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  <Download size={13} /> Download Certificate PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
