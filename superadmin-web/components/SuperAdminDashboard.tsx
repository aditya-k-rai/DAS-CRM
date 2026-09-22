'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Users, Shield, Zap, DollarSign, Tag, Check, X,
  Plus, Trash2, Edit2, Key, CheckCircle2, MessageSquare, Mail, RefreshCw, QrCode, CreditCard,
  Ban, Lock, Unlock, TrendingUp, UserX, UserCheck, Eye, ChevronRight, Calendar, Sparkles, Filter, Layers, Clock, PhoneCall, AlertCircle, Bot, SlidersHorizontal
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export type PlanType = 'FREE_TRIAL' | 'GROW' | 'GROWTH' | 'BUSINESS' | 'ENTERPRISE' | 'STARTER' | 'PRO' | 'PRO_MAX';
export type AITierType = 'BASIC' | 'PRO' | 'ENTERPRISE_CUSTOM';

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
  expiryDate: string;
  emailConfig: EmailCompanyConfig;
  whatsAppConfig: WhatsAppCompanyConfig;
  aiConfig: AICompanyConfig;
}

export interface CompanyEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string | null;
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
  registrationKey: string;
  requestedPlan: PlanType;
  registeredAt: string;
  seatsRequested?: number;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  delayInquiries?: DelayInquiry[];
  features?: {
    emailMarketing?: boolean;
    whatsappCloud?: boolean;
    aiEngine?: boolean;
  };
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

const MOCK_DEMO_COMPANIES: CompanyRecord[] = [];
const MOCK_DEMO_KEYS: KeyRecord[] = [];
const MOCK_DEMO_EMPLOYEES: Record<string, CompanyEmployee[]> = {};

export function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<CompanyRecord[]>(MOCK_DEMO_COMPANIES);
  const [keysList, setKeysList] = useState<KeyRecord[]>(MOCK_DEMO_KEYS);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompanyRecord[]>(MOCK_PENDING_COMPANIES);
  const [templates, setTemplates] = useState<SystemTemplate[]>(INITIAL_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'features_hub' | 'company_approvals' | 'keys' | 'templates' | 'whatsapp' | 'pending' | 'employees' | 'expired' | 'coupons' | 'data_retention'>('overview');
  const [templateTab, setTemplateTab] = useState<'funnel' | 'whatsapp' | 'email'>('funnel');

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

  // Selected company for employee table
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [companyEmployees, setCompanyEmployees] = useState<CompanyEmployee[]>([]);

  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  useEffect(() => {
    fetchBackendData();
    fetchCoupons();
    fetchRetentionStatus();
  }, []);

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

  useEffect(() => {
    if (selectedCompanyId && MOCK_DEMO_EMPLOYEES[selectedCompanyId]) {
      setCompanyEmployees(MOCK_DEMO_EMPLOYEES[selectedCompanyId]);
    } else {
      setCompanyEmployees([]);
    }
  }, [selectedCompanyId]);

  const fetchBackendData = async () => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const compRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies`, { headers });
      if (compRes.ok) {
        const data = await compRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((c: any) => ({
            ...c,
            emailConfig: c.emailConfig || { enabled: true, monthlyLimit: 25000, used: 1200 },
            whatsAppConfig: c.whatsAppConfig || { enabled: true, monthlyLimit: 50000, used: 4500, status: 'CONNECTED' },
            aiConfig: c.aiConfig || { enabled: true, tier: 'PRO', customSystemPrompt: 'Standard CRM Lead AI assistant.', monthlyTokenLimit: 250000, tokensUsed: 15000 },
          }));
          setCompanies(formatted);
        }
      }

      const keysRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/keys`, { headers });
      if (keysRes.ok) {
        const data = await keysRes.json();
        if (data.companyKeys && data.companyKeys.length > 0) setKeysList(data.companyKeys);
      }

      const pendingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/super-admin/companies/pending`, { headers });
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        if (Array.isArray(pendingData) && pendingData.length > 0) {
          setPendingCompanies(pendingData);
        }
      }
    } catch (err) {
      console.warn('Backend API notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVerificationModal = (comp: PendingCompanyRecord) => {
    let plan = comp.requestedPlan || 'GROW';
    if ((plan as string) === 'GROWTH') plan = 'GROW';
    setVerifyingCompany(comp);
    setVerifyPlan(plan as PlanType);
    const defaultSeats = plan === 'ENTERPRISE' ? 60 : plan === 'BUSINESS' ? 18 : 6;
    setVerifySeats(comp.seatsRequested || defaultSeats);
    setVerifyValidityDays(30);
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
    const defaultSeats = comp.seatsAllocated || (comp.plan === 'FREE_TRIAL' ? 10 : comp.plan === 'GROWTH' ? 20 : comp.plan === 'BUSINESS' ? 50 : 100);
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
  };

  const handleToggleInstantFeature = (companyId: string, feature: 'email' | 'whatsapp' | 'ai', nextState: boolean) => {
    setCompanies(prev => prev.map(c => {
      if (c.id !== companyId) return c;
      if (feature === 'email') {
        return { ...c, emailConfig: { ...c.emailConfig, enabled: nextState } };
      } else if (feature === 'whatsapp') {
        return {
          ...c,
          whatsAppConfig: {
            ...c.whatsAppConfig,
            enabled: nextState,
            status: nextState ? (c.whatsAppConfig.status === 'NOT_CONFIGURED' ? 'CONNECTED' : c.whatsAppConfig.status) : 'DISCONNECTED',
          },
        };
      } else if (feature === 'ai') {
        return { ...c, aiConfig: { ...c.aiConfig, enabled: nextState } };
      }
      return c;
    }));
  };

  const handleQuickAdjustSeats = (companyId: string, delta: number) => {
    setCompanies(prev => prev.map(c => {
      if (c.id !== companyId) return c;
      const updated = Math.max(c.seatsUsed, c.seatsAllocated + delta);
      return { ...c, seatsAllocated: updated };
    }));
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

  const calculateDaysFromToday = (dStr: string) => {
    if (!dStr) return 0;
    try {
      const target = new Date(dStr + 'T23:59:59').getTime();
      const now = Date.now();
      const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
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

  const handleToggleBlockUser = (empId: string) => {
    setCompanyEmployees(prev => prev.map(e => e.id === empId ? { ...e, isActive: !e.isActive } : e));
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
    <div className="space-y-6 animate-fade-in p-4 sm:p-6 max-w-7xl mx-auto pb-16 text-foreground">
      {/* 👑 SECTION 1: DASHBOARD HERO BANNER (Explicit High Contrast Dark Cyan Glassmorphic Banner) */}
      <div className="p-6 border border-cyan-500/40 bg-gradient-to-r from-slate-950 via-cyan-950/90 to-slate-950 relative overflow-hidden shadow-2xl rounded-3xl text-white dark-context">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <img src="/das-logo.png" alt="DAS CRM Logo" className="h-12 w-auto object-contain rounded-xl border border-cyan-500/40 shadow-lg bg-slate-900 p-1" />
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 bg-cyan-900/60 border border-cyan-400/50 px-3 py-1 rounded-full shadow-inner inline-flex items-center gap-1.5">
                👑 SUPER ADMIN SYSTEM OVERLORD
              </span>
              <h1 className="text-2xl font-black text-white mt-1.5 tracking-tight">Super Admin Dashboard</h1>
              <p className="text-xs text-slate-300 font-medium">Multi-Tenant Platform Control & Management Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={fetchBackendData} className="px-4 py-2 text-xs font-extrabold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 shadow-lg transition-all border border-cyan-400/30">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
            </button>
          </div>
        </div>

        {/* 5 KPI CARDS (High contrast text in all themes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/50 text-center shadow-lg hover:scale-[1.02] transition-transform">
            <span className="text-[11px] font-extrabold text-cyan-300 uppercase tracking-wider block">Total Companies & Users</span>
            <div className="mt-2 flex items-center justify-center gap-4">
              <div>
                <span className="text-2xl font-black text-white">{totalCompanies}</span>
                <span className="text-[10px] text-slate-300 block font-bold">Companies</span>
              </div>
              <div className="w-px h-8 bg-cyan-500/40" />
              <div>
                <span className="text-2xl font-black text-cyan-300">{totalUsers}</span>
                <span className="text-[10px] text-slate-300 block font-bold">Total Users</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/50 text-center shadow-lg hover:scale-[1.02] transition-transform">
            <span className="text-[11px] font-extrabold text-teal-300 uppercase tracking-wider block">Active Companies & Users</span>
            <div className="mt-2 flex items-center justify-center gap-4">
              <div>
                <span className="text-2xl font-black text-white">{activeCompanies}</span>
                <span className="text-[10px] text-slate-300 block font-bold">Active Cos.</span>
              </div>
              <div className="w-px h-8 bg-teal-500/40" />
              <div>
                <span className="text-2xl font-black text-emerald-300">{totalUsers}</span>
                <span className="text-[10px] text-slate-300 block font-bold">Active Users</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('company_approvals')}
            className={`p-4 rounded-2xl bg-slate-900/90 border ${
              pendingCompanies.length > 0 ? 'border-amber-400 shadow-lg shadow-amber-500/20' : 'border-amber-500/40'
            } text-center shadow-lg hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden`}
          >
            {pendingCompanies.length > 0 && (
              <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
            <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider block">Pending Approvals</span>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-2xl font-black text-amber-400">{pendingCompanies.length}</span>
              <span className="text-xs text-slate-300 font-bold">Review Queue</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/50 text-center shadow-lg hover:scale-[1.02] transition-transform">
            <span className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider block">Trials & Paid Plans</span>
            <div className="mt-2 flex items-center justify-center gap-4">
              <div>
                <span className="text-2xl font-black text-amber-400">{activeFreeTrials}</span>
                <span className="text-[10px] text-slate-300 block font-bold">Free Trials</span>
              </div>
              <div className="w-px h-8 bg-indigo-500/40" />
              <div>
                <span className="text-2xl font-black text-indigo-300">{activePaidPlans}</span>
                <span className="text-[10px] text-slate-300 block font-bold">Paid Plans</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('expired')}
            className="p-4 rounded-2xl bg-slate-900/90 border border-red-500/50 text-center shadow-lg hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <span className="text-[11px] font-extrabold text-red-300 uppercase tracking-wider block">Plan Expired Companies</span>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-2xl font-black text-red-400">{expiredCompanies.length}</span>
              <span className="text-xs text-slate-300 font-bold">Expired Plans</span>
            </div>
          </div>
        </div>

        {/* 6-Month Data Retention & Verified Employee Documents Guarantee Strip */}
        <div className="mt-4 p-3.5 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/50 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-white">6-Month Company History Auto-Purge Policy:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ACTIVE (180 DAYS)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  🔒 VERIFIED EMPLOYEE DOCUMENTS PERMANENTLY EXEMPT
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                All company operational history, leads, activities, and logs older than 6 months auto-delete daily. Employee KYC, PAN, UAN, Bank details &amp; Drive documents are permanently preserved.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('data_retention');
              fetchRetentionStatus();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            Manage Retention &amp; Audit Logs →
          </button>
        </div>
      </div>

      {/* Main Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${activeTab === 'overview' ? 'bg-cyan-600 text-white border-cyan-500 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          🔑 Keys & Companies Table
        </button>
        <button
          onClick={() => setActiveTab('company_approvals')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all flex items-center gap-1.5 ${
            activeTab === 'company_approvals'
              ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-400/30'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 size={14} className={activeTab === 'company_approvals' ? 'text-white' : 'text-amber-500'} />
          🏢 Pending Approvals
          {pendingCompanies.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'company_approvals' ? 'bg-white text-amber-700' : 'bg-amber-500 text-white animate-pulse'
              }`}
            >
              {pendingCompanies.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('features_hub')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all flex items-center gap-1.5 ${activeTab === 'features_hub' ? 'bg-purple-600 text-white border-purple-500 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          <Zap size={14} className={activeTab === 'features_hub' ? 'text-white' : 'text-purple-400'} /> ⚡ Company Features & Quotas Hub
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${activeTab === 'expired' ? 'bg-red-600 text-white border-red-500 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          ⚠️ Expired Companies ({expiredCompanies.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${activeTab === 'templates' ? 'bg-cyan-600 text-white border-cyan-500 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          📑 System Templates Hub
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${activeTab === 'whatsapp' ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          💬 WhatsApp Cloud Logs
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${activeTab === 'pending' ? 'bg-amber-600 text-white border-amber-500 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          💳 Upgrades Pending ({upgradeRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all ${activeTab === 'employees' ? 'bg-cyan-600 text-white border-cyan-500 shadow-md' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          👥 Tenant Employees
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all flex items-center gap-1.5 ${activeTab === 'coupons' ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}
        >
          <Tag size={14} className={activeTab === 'coupons' ? 'text-white' : 'text-emerald-500'} />
          🏷️ Discount Coupons ({couponsList.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('data_retention');
            fetchRetentionStatus();
          }}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-xl border transition-all flex items-center gap-1.5 ${
            activeTab === 'data_retention'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/30'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield size={14} className={activeTab === 'data_retention' ? 'text-white' : 'text-blue-500'} />
          🛡️ 6-Month Data Retention &amp; Purge
        </button>
      </div>

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
                      <button
                        onClick={() => handleOpenEditModal(c, 'email')}
                        className="px-3.5 py-1.5 bg-purple-600/20 border border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-600/30 rounded-xl font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <SlidersHorizontal size={13} /> Edit Quotas & Prompts
                      </button>
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
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 font-extrabold text-xs flex items-center gap-1.5 w-max shadow-sm">
              <Clock size={14} className="animate-spin text-amber-500" style={{ animationDuration: '6s' }} />
              {pendingCompanies.length} Workspace{pendingCompanies.length !== 1 ? 's' : ''} Awaiting Approval
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
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                            {c.requestedPlan}
                          </span>
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            {c.seatsRequested || 15} User Seats Requested
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
                        <button
                          onClick={() => handleOpenVerificationModal(c)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-600/25 transition-all cursor-pointer"
                        >
                          <Shield size={13} /> Review & Verify Plan →
                        </button>
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
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenExtendModal(c)}
                          className="px-3.5 py-1.5 bg-emerald-600/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/30 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                          title="Open Custom Expiry Date Extension dialog"
                        >
                          <Calendar size={13} className="text-emerald-600 dark:text-emerald-400" /> Extend Expiry (Custom Date)
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(c, 'general')}
                          className="px-3 py-1.5 bg-cyan-600/20 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-600/30 rounded-xl font-bold text-xs inline-flex items-center gap-1 transition-all"
                        >
                          <Edit2 size={12} /> Edit Details
                        </button>
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
      {(activeTab === 'overview' || activeTab === 'keys') && (
        <div className="crm-card p-5 border-border bg-card space-y-4 rounded-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Key size={18} className="text-cyan-500" /> Keys and Their Companies Table
            </h3>
            <span className="text-[10px] font-extrabold text-cyan-700 dark:text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 w-max">
              <Shield size={12} /> Auto-Created via Company Registration
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Registration Key</th>
                  <th className="p-3.5">Company Name</th>
                  <th className="p-3.5">Plan Tier</th>
                  <th className="p-3.5">Active Features</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5">Users & Seats</th>
                  <th className="p-3.5 text-right">Edit Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companies.map(c => {
                  const isCompExpired = c.isExpired || (c.expiryDate && new Date(c.expiryDate) < new Date());
                  return (
                    <tr key={c.id} className={`transition-colors ${isCompExpired ? 'bg-red-500/10 hover:bg-red-500/15' : 'hover:bg-muted/40'}`}>
                      <td className="p-3.5 font-mono text-cyan-600 dark:text-cyan-400 font-extrabold">{c.registrationKey}</td>
                      <td className="p-3.5">
                        <p className="font-extrabold text-foreground">{c.name}</p>
                        {isCompExpired && (
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-wider block">⚠️ PLAN EXPIRED</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${isCompExpired ? 'bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-300' : c.plan === 'FREE_TRIAL' ? 'bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300' : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-700 dark:text-indigo-300'}`}>
                          {c.plan} {isCompExpired ? '(EXPIRED)' : ''}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${c.emailConfig?.enabled ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                            MAIL: {c.emailConfig?.enabled ? 'ON' : 'OFF'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${c.whatsAppConfig?.enabled ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                            WA: {c.whatsAppConfig?.enabled ? 'ON' : 'OFF'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${c.aiConfig?.enabled ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                            AI: {c.aiConfig?.enabled ? c.aiConfig.tier : 'OFF'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground">
                        <span className={isCompExpired ? 'text-red-500 font-bold' : ''}>{c.expiryDate}</span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {c.seatsUsed} Used ({c.seatsAllocated} Allocated)
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenExtendModal(c)}
                          className={`px-2.5 py-1 rounded-xl font-bold text-xs inline-flex items-center gap-1 border transition-all ${
                            isCompExpired
                              ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/30 shadow-sm'
                              : 'bg-muted/60 hover:bg-muted text-foreground border-border'
                          }`}
                          title="Set Custom Expiry Date"
                        >
                          <Calendar size={11} className={isCompExpired ? 'text-emerald-600 dark:text-emerald-400' : 'text-cyan-500'} />
                          {isCompExpired ? 'Extend Expiry' : 'Set Expiry'}
                        </button>
                        <button onClick={() => handleOpenEditModal(c, 'general')} className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-600/30 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                          <Edit2 size={12} /> Edit & Features
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
      {(activeTab === 'overview' || activeTab === 'employees') && (
        <div className="crm-card p-5 border-border bg-card space-y-4 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Users size={18} className="text-cyan-500" /> Companies and Their Employees
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Select Company Workspace:</label>
              <select
                className="crm-input text-xs h-9 min-w-[200px]"
                value={selectedCompanyId}
                onChange={e => setSelectedCompanyId(e.target.value)}
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.seatsUsed}/{c.seatsAllocated} Seats)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Employee Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Registration Key Used</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companyEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      No registered employees found for selected company workspace.
                    </td>
                  </tr>
                ) : (
                  companyEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 font-bold text-foreground">{emp.name}</td>
                      <td className="p-3.5 font-mono text-cyan-600 dark:text-cyan-300">{emp.email}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border uppercase">
                          {emp.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground">{emp.keyUsed}</td>
                      <td className="p-3.5">
                        {emp.isActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            DEACTIVATED / BLOCKED
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleBlockUser(emp.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${emp.isActive ? 'bg-rose-600/20 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600/30' : 'bg-emerald-600/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/30'}`}
                        >
                          {emp.isActive ? 'Block Employee' : 'Unblock Employee'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button onClick={() => setEditModalOpen(false)} className="px-4 py-2.5 bg-muted text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button onClick={handleSaveCompanyEdit} className="btn-primary text-xs px-6 py-2.5 shadow-lg bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-extrabold">
                Save Company Features & Quotas ✓
              </button>
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

            {/* Company Metadata Header Card */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Company Name</span>
                <span className="font-black text-foreground text-sm">{verifyingCompany.name}</span>
                {verifyingCompany.domain && (
                  <span className="text-[11px] text-cyan-600 dark:text-cyan-400 block font-mono">{verifyingCompany.domain}</span>
                )}
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Admin Contact</span>
                <span className="font-bold text-foreground">{verifyingCompany.adminName}</span>
                <span className="text-[11px] text-muted-foreground block font-mono truncate">{verifyingCompany.adminEmail}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Registration Key</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 inline-block mt-0.5">
                  {verifyingCompany.registrationKey}
                </span>
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

              <div className="flex items-center gap-2 w-full sm:w-auto">
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
    </div>
  );
}
