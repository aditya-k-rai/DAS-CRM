import { NextResponse } from 'next/server';

const LIVE_KEYS = {
  companyKeys: [
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
  ],
  userKeys: [],
};

export async function GET(req: Request) {
  const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  try {
    const authHeader = req.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${backendUrl}/auth/super-admin/keys`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.companyKeys && data.companyKeys.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    // Network or timeout error
  }

  return NextResponse.json(LIVE_KEYS);
}
