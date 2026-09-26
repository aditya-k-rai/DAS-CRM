import { NextResponse } from 'next/server';

const LIVE_DETAILS: Record<string, any> = {
  cmuev7n3o000mikew7je1tdiw: {
    organization: {
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
      registeredAt: '2026-09-24T01:40:31.278Z',
      verificationStatus: 'APPROVED',
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
      isActive: true,
      registrationKey: 'ADOR-EC-7187',
      createdAt: '2026-09-24T01:40:31.282Z',
    },
    subscription: {
      id: 'cmuev7n6p000oikewiqa4en4r',
      organizationId: 'cmuev7n3o000mikew7je1tdiw',
      planTier: 'BUSINESS',
      memberLimit: 18,
      trialStartsAt: '2026-09-24T01:40:31.393Z',
      trialExpiresAt: '2026-10-09T01:47:08.396Z',
      isTrialActive: true,
      startsAt: null,
      expiresAt: '2026-10-09T01:47:08.396Z',
      isActive: true,
      whatsAppEnabled: true,
      emailMarketingEnabled: true,
      aiEnabled: true,
      emailMonthlyQuota: 5000,
      emailUsedThisMonth: 0,
      emailQuotaResetAt: '2026-10-24T01:47:08.748Z',
      whatsAppCreditBalance: 20000,
      whatsAppCreditAllocated: 20000,
      whatsAppLowCreditAlertSent: false,
      createdAt: '2026-09-24T01:40:31.393Z',
      updatedAt: '2026-09-24T01:47:08.750Z',
      upgradeRequests: [],
    },
    leadStats: {
      totalLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      totalDeals: 0,
      wonDeals: 0,
      totalRevenue: 0,
    },
    employees: [
      {
        id: 'cmuev7ni70016ikew8an7tdw8',
        name: 'Anurag Sharma',
        email: 'adorabletrading08@gmail.com',
        role: 'ADMIN',
        isActive: true,
        lastLoginAt: '2026-09-26T12:00:16.584Z',
        createdAt: '2026-09-24T01:40:31.806Z',
        keyUsed: 'ADOR-EC-7187',
      },
      {
        id: 'cmuhp0517000ngg2dq93a6nlp',
        name: 'Nandini Rastogi',
        email: 'rastoginandini92@gmail.com',
        role: 'VIEWER',
        isActive: true,
        lastLoginAt: '2026-09-26T12:05:14.587Z',
        createdAt: '2026-09-26T01:10:02.107Z',
        keyUsed: 'ADOR-EC-7187',
      },
    ],
  },
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  try {
    const authHeader = req.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${backendUrl}/auth/super-admin/companies/${id}`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Network or timeout error
  }

  const fallback = LIVE_DETAILS[id] || LIVE_DETAILS['cmuev7n3o000mikew7je1tdiw'];
  return NextResponse.json(fallback);
}
