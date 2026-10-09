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

  return NextResponse.json(getStoredCompanies());
}
