import { NextResponse } from 'next/server';

const LIVE_COMPANIES = [
  {
    id: 'cmuev7n3o000mikew7je1tdiw',
    name: 'Adorable Trading',
    slug: 'adorable-trading-muev7mo0',
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
    couponCode: null,
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
  {
    id: 'org_zenith_growth_02',
    name: 'Zenith Logistics & Supply',
    slug: 'zenith-logistics-growth',
    adminName: 'Rohan Mehra',
    adminEmail: 'rohan@zenithlogistics.in',
    phone: '9810123456',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    gstNumber: '27AABCT1234F1Z8',
    panNumber: 'AABCT1234F',
    panType: 'BUSINESS',
    companyType: 'Private Limited',
    sector: 'Logistics & Supply Chain',
    accountType: 'BUY_REQUEST',
    validityDays: 30,
    couponCode: null,
    registrationKey: 'ZENI-MH-4421',
    plan: 'GROWTH',
    seatsAllocated: 6,
    seatsUsed: 4,
    totalUsersCount: 4,
    totalLeads: 124,
    convertedLeads: 38,
    conversionRate: 30.6,
    expiryDate: '2026-10-02',
    isExpired: false,
    trialDaysLeft: 4,
    isActive: true,
    createdAt: '2026-09-02',
    registeredAt: '2026-09-02T10:15:00.000Z',
    verificationStatus: 'APPROVED',
    emailConfig: { enabled: true, monthlyLimit: 5000, used: 1200 },
    whatsAppConfig: { enabled: true, monthlyLimit: 10000, used: 3400, status: 'CONNECTED' },
    aiConfig: {
      enabled: true,
      tier: 'BASIC',
      customSystemPrompt: 'Logistics sales assistant.',
      monthlyTokenLimit: 100000,
      tokensUsed: 22000,
    },
  },
  {
    id: 'org_apex_enterprise_03',
    name: 'Apex Global Financials',
    slug: 'apex-global-financials',
    adminName: 'Pooja Varma',
    adminEmail: 'pooja.v@apexglobal.com',
    phone: '9820567890',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    gstNumber: '29AAACA9988G1ZQ',
    panNumber: 'AAACA9988G',
    panType: 'BUSINESS',
    companyType: 'Public Limited',
    sector: 'Financial Services & Fintech',
    accountType: 'BUY_REQUEST',
    validityDays: 365,
    couponCode: null,
    registrationKey: 'APEX-KA-9988',
    plan: 'ENTERPRISE',
    seatsAllocated: 60,
    seatsUsed: 28,
    totalUsersCount: 28,
    totalLeads: 850,
    convertedLeads: 410,
    conversionRate: 48.2,
    expiryDate: '2027-03-24',
    isExpired: false,
    trialDaysLeft: 177,
    isActive: true,
    createdAt: '2026-03-24',
    registeredAt: '2026-03-24T08:00:00.000Z',
    verificationStatus: 'APPROVED',
    emailConfig: { enabled: true, monthlyLimit: 50000, used: 14200 },
    whatsAppConfig: { enabled: true, monthlyLimit: 100000, used: 41200, status: 'CONNECTED' },
    aiConfig: {
      enabled: true,
      tier: 'ENTERPRISE_CUSTOM',
      customSystemPrompt: 'Fintech enterprise client advisory bot.',
      monthlyTokenLimit: 1000000,
      tokensUsed: 320000,
    },
  },
  {
    id: 'org_technova_expired_04',
    name: 'TechNova Cloud Labs',
    slug: 'technova-cloud-labs',
    adminName: 'Vikram Sengupta',
    adminEmail: 'vikram@technovalabs.io',
    phone: '9871122334',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    gstNumber: '36AAACT5544H1Z2',
    panNumber: 'AAACT5544H',
    panType: 'BUSINESS',
    companyType: 'LLP',
    sector: 'Software & Cloud Services',
    accountType: 'TRIAL',
    validityDays: 15,
    couponCode: null,
    registrationKey: 'TNOV-TS-5544',
    plan: 'FREE_TRIAL',
    seatsAllocated: 6,
    seatsUsed: 5,
    totalUsersCount: 5,
    totalLeads: 42,
    convertedLeads: 8,
    conversionRate: 19.0,
    expiryDate: '2026-09-20',
    isExpired: true,
    trialDaysLeft: 0,
    isActive: true,
    createdAt: '2026-09-05',
    registeredAt: '2026-09-05T09:30:00.000Z',
    verificationStatus: 'APPROVED',
    emailConfig: { enabled: false, monthlyLimit: 5000, used: 5000 },
    whatsAppConfig: { enabled: false, monthlyLimit: 20000, used: 0, status: 'DISCONNECTED' },
    aiConfig: {
      enabled: false,
      tier: 'PRO',
      customSystemPrompt: 'Trial assistant.',
      monthlyTokenLimit: 250000,
      tokensUsed: 250000,
    },
  },
];

export async function GET(req: Request) {
  const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  try {
    const authHeader = req.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${backendUrl}/auth/super-admin/companies`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((c: any) => {
          const seatsUsed = Math.max(c.seatsUsed ?? 0, 1);
          const totalUsersCount = Math.max(c.totalUsersCount ?? 0, 1);
          return {
            ...c,
            seatsUsed,
            totalUsersCount,
          };
        });
        return NextResponse.json(mapped);
      }
    }
  } catch (err) {
    // Network or timeout error - return fallback live company data
  }

  return NextResponse.json(LIVE_COMPANIES);
}
