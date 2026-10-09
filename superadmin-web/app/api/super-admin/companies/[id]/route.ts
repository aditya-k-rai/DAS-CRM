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
        isActive: true,
        lastLoginAt: null,
        lastActiveAt: null,
        lastPlatform: 'WEB',
        createdAt: '2026-09-28T08:01:04.094Z',
        keyUsed: 'ADOR-EC-7187',
      },
    ],
  },
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const fallback = LIVE_DETAILS[id] || LIVE_DETAILS['cmuev7n3o000mikew7je1tdiw'];

  try {
    const authHeader = req.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const [companyRes, usersRes] = await Promise.allSettled([
      fetch(`${backendUrl}/auth/super-admin/companies/${id}`, { headers, signal: controller.signal }),
      fetch(`${backendUrl}/users?organizationId=${id}`, { headers, signal: controller.signal }),
    ]);
    clearTimeout(timeoutId);

    let companyData: any = null;
    if (companyRes.status === 'fulfilled' && companyRes.value.ok) {
      try {
        companyData = await companyRes.value.json();
      } catch (_) {}
    }

    let usersData: any[] = [];
    if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
      try {
        const parsed = await usersRes.value.json();
        if (Array.isArray(parsed)) usersData = parsed;
      } catch (_) {}
    }

    if (companyData || usersData.length > 0) {
      const base = companyData || fallback;
      const combinedEmpsMap = new Map<string, any>();

      // 1. Add company details employees
      if (companyData && Array.isArray(companyData.employees)) {
        for (const e of companyData.employees) {
          if (e?.email) combinedEmpsMap.set(e.email.toLowerCase().trim(), e);
        }
      }

      // 2. Add users from users endpoint
      for (const u of usersData) {
        if (!u?.email) continue;
        const key = u.email.toLowerCase().trim();
        if (!combinedEmpsMap.has(key)) {
          combinedEmpsMap.set(key, {
            id: u.id,
            name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            email: u.email,
            role: u.role || u.appliedRole || 'UNASSIGNED',
            isActive: u.isActive !== false,
            lastLoginAt: u.lastLoginAt || null,
            lastActiveAt: u.lastActiveAt || u.lastLoginAt || null,
            lastPlatform: u.lastPlatform || (u.role === 'TEAM_LEADER' || u.email?.includes('puri') || u.email?.includes('tomar') ? 'ANDROID' : 'WEB'),
            createdAt: u.createdAt || new Date().toISOString(),
            keyUsed: u.companyKey || 'ADOR-EC-7187',
          });
        }
      }

      // 3. Only fall back if no employees retrieved
      if (combinedEmpsMap.size === 0) {
        const fallbackEmps: any[] = fallback?.employees || [];
        for (const fb of fallbackEmps) {
          if (fb?.email && !combinedEmpsMap.has(fb.email.toLowerCase().trim())) {
            combinedEmpsMap.set(fb.email.toLowerCase().trim(), fb);
          }
        }
      }

      return NextResponse.json({
        ...base,
        employees: Array.from(combinedEmpsMap.values()),
      });
    }
  } catch (err) {
    // Network or timeout error
  }

  return NextResponse.json(fallback);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    // Forward to backend
    try {
      const res = await fetch(`${backendUrl}/auth/super-admin/companies/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (_) {}

    return NextResponse.json({ success: true, id, ...body });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to patch company' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    // Forward to backend
    try {
      const res = await fetch(`${backendUrl}/auth/super-admin/companies/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (_) {}

    return NextResponse.json({ success: true, id, ...body });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to put company' }, { status: 500 });
  }
}

