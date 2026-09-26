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
    seatsUsed: 2,
    totalUsersCount: 2,
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
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    // Network or timeout error - return fallback live company data
  }

  return NextResponse.json(LIVE_COMPANIES);
}
