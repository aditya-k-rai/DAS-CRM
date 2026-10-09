import { NextResponse } from 'next/server';
import { getStoredCompanies } from '@/lib/superAdminStore';

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

  const companies = getStoredCompanies();
  const companyKeys = companies.map(c => ({
    id: `key_${c.id}`,
    key: c.registrationKey || 'ADOR-EC-7187',
    companyName: c.name,
    planTier: c.plan,
    memberLimit: c.seatsAllocated || 18,
    validityDays: c.validityDays || 30,
    status: c.isExpired ? 'EXPIRED' : 'ACTIVE',
    expiresAt: c.expiryDate ? `${c.expiryDate}T23:59:59.000Z` : new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: c.createdAt,
  }));

  return NextResponse.json({
    companyKeys,
    userKeys: [],
  });
}
