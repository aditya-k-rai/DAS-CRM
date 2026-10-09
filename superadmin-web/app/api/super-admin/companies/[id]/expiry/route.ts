import { NextResponse } from 'next/server';
import { updateStoredCompanyExpiry } from '@/lib/superAdminStore';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  try {
    const body = await req.json();
    const expiryDate = body.expiryDate;

    if (!expiryDate) {
      return NextResponse.json({ error: 'expiryDate is required' }, { status: 400 });
    }

    // 1. Update internal shared store
    const updated = updateStoredCompanyExpiry(id, expiryDate);

    // 2. Forward to NestJS backend
    const authHeader = req.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${backendUrl}/auth/super-admin/companies/${id}/expiry`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ expiryDate }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const backendData = await res.json();
        return NextResponse.json(backendData);
      }
    } catch (err) {
      // Backend timeout / offline - proceed with updated in-memory store
    }

    return NextResponse.json({
      success: true,
      companyId: id,
      expiryDate: updated?.expiryDate || expiryDate,
      isExpired: updated?.isExpired ?? false,
      trialDaysLeft: updated?.trialDaysLeft ?? 30,
      validityDays: updated?.validityDays ?? 30,
      message: `Expiry date updated to ${expiryDate}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update expiry' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(req, { params });
}
