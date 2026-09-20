/**
 * plan-config.ts — Single Source of Truth for all 3 Product Plan Definitions
 *
 * Rules:
 *  - GROW      : 6 users, no Email/WA/AI, cannot self-upgrade
 *  - BUSINESS  : 18 users, 5K email/mo quota, 20K WA credit wallet, AI enabled
 *  - ENTERPRISE: 60 users, unlimited email, unlimited WA, AI enabled
 *
 * WhatsApp credits = running wallet (not monthly reset).
 * emailMonthlyQuota = 0 means unlimited (Enterprise) or N/A (Grow).
 * whatsAppCreditAllocation = 0 means unlimited (Enterprise) or N/A (Grow).
 */

export type PlanKey = 'FREE_TRIAL' | 'GROW' | 'BUSINESS' | 'ENTERPRISE';
export type AITier = 'NONE' | 'BASIC' | 'PRO' | 'ENTERPRISE_CUSTOM';

export interface PlanDefinition {
  key: PlanKey;
  label: string;
  tagline: string;
  color: string;
  memberLimit: number;    // 0 = unlimited
  // Email Marketing
  emailEnabled: boolean;
  emailMonthlyQuota: number; // 0 = unlimited or N/A
  // WhatsApp Cloud
  whatsAppEnabled: boolean;
  whatsAppCreditAllocation: number; // 0 = unlimited or N/A
  // AI Engine
  aiEnabled: boolean;
  aiTier: AITier;
  // Plan management
  upgradeable: boolean;
  // Display metadata
  features: string[];
  restrictions: string[];
  badge?: string;
}

export const PLAN_DEFINITIONS: Record<PlanKey, PlanDefinition> = {
  FREE_TRIAL: {
    key: 'FREE_TRIAL',
    label: 'Free Trial',
    tagline: 'Explore the platform risk-free',
    color: '#6366f1',
    memberLimit: 6,
    emailEnabled: false,
    emailMonthlyQuota: 0,
    whatsAppEnabled: false,
    whatsAppCreditAllocation: 0,
    aiEnabled: false,
    aiTier: 'NONE',
    upgradeable: true,
    features: ['CRM Core', 'Lead Management', 'Pipeline', 'Mobile App', 'Up to 6 users'],
    restrictions: ['No Email Marketing', 'No WhatsApp Cloud', 'No AI Engine', 'Trial period only'],
    badge: 'Trial',
  },

  GROW: {
    key: 'GROW',
    label: 'Grow',
    tagline: 'Perfect for small sales teams',
    color: '#818cf8',
    memberLimit: 6,
    emailEnabled: false,
    emailMonthlyQuota: 0,
    whatsAppEnabled: false,
    whatsAppCreditAllocation: 0,
    aiEnabled: false,
    aiTier: 'NONE',
    upgradeable: false,
    features: [
      'CRM Core — Leads, Contacts, Deals',
      'Sales Pipeline & Kanban',
      'Task & Activity Management',
      'Basic Reports & Analytics',
      'Mobile App (Android & iOS)',
      'Up to 6 users',
    ],
    restrictions: [
      'No Email Marketing module',
      'No WhatsApp Cloud Integration',
      'No AI Lead Scoring / Engine',
      'Maximum 6 employee accounts',
      'Cannot self-upgrade — contact Super Admin',
    ],
  },

  BUSINESS: {
    key: 'BUSINESS',
    label: 'Business',
    tagline: 'All features for growing sales teams',
    color: '#f59e0b',
    memberLimit: 18,
    emailEnabled: true,
    emailMonthlyQuota: 5000,
    whatsAppEnabled: true,
    whatsAppCreditAllocation: 20000,
    aiEnabled: true,
    aiTier: 'PRO',
    upgradeable: true,
    badge: 'Most Popular',
    features: [
      'All Grow plan features',
      'Email Marketing — 5,000 emails/month',
      'WhatsApp Cloud — 20,000 credit wallet',
      'AI Lead Scoring & Automation Engine',
      'Advanced Reports & Dashboards',
      'Up to 18 users',
    ],
    restrictions: [
      'Email quota: 5,000 per month (reset monthly)',
      'WhatsApp: 20,000 credit wallet (running balance)',
      'Contact Super Admin to top up WhatsApp credits',
      'Maximum 18 employee accounts',
    ],
  },

  ENTERPRISE: {
    key: 'ENTERPRISE',
    label: 'Enterprise',
    tagline: 'No limits — full power for large organizations',
    color: '#22c55e',
    memberLimit: 60,
    emailEnabled: true,
    emailMonthlyQuota: 0,
    whatsAppEnabled: true,
    whatsAppCreditAllocation: 0,
    aiEnabled: true,
    aiTier: 'ENTERPRISE_CUSTOM',
    upgradeable: false,
    badge: 'Enterprise',
    features: [
      'All Business plan features',
      'Unlimited Email Marketing',
      'Unlimited WhatsApp Cloud',
      'Custom AI Engine with custom prompts',
      'Full Analytics & Audit Logs',
      'Priority Support & SLA',
      'Up to 60 users',
    ],
    restrictions: [
      'Maximum 60 employee accounts',
    ],
  },
};

export function getPlanDefinition(planKey: string): PlanDefinition {
  const normalized = planKey?.toUpperCase() as PlanKey;
  return PLAN_DEFINITIONS[normalized] ?? PLAN_DEFINITIONS['GROW'];
}

export function isPlanFeatureEnabled(planKey: string, feature: 'email' | 'whatsapp' | 'ai'): boolean {
  const plan = getPlanDefinition(planKey);
  if (feature === 'email') return plan.emailEnabled;
  if (feature === 'whatsapp') return plan.whatsAppEnabled;
  if (feature === 'ai') return plan.aiEnabled;
  return false;
}

export const WHATSAPP_LOW_CREDIT_THRESHOLD_PERCENT = 0.20;
export const REGISTERABLE_PLANS: PlanKey[] = ['GROW', 'BUSINESS', 'ENTERPRISE'];
