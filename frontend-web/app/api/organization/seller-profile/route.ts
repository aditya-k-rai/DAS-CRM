import { NextResponse } from 'next/server';
import {
  getLocalSellerProfile,
  saveLocalSellerProfile,
  getLocalSellerCompanies,
  saveLocalSellerCompanies,
  SellerProfile,
} from '@/lib/serverSellerParties';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  try {
    const localProfile = getLocalSellerProfile();
    const localCompanies = getLocalSellerCompanies();

    // Also attempt to fetch from backend
    try {
      const authHeader = req.headers.get('Authorization');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const backendRes = await fetch(`${apiBase}/organizations/seller-profile`, {
        headers: authHeader ? { Authorization: authHeader } : {},
      }).catch(() => null);

      if (backendRes && backendRes.ok) {
        const backendData = await backendRes.json();
        if (backendData && (backendData.name || backendData.logoUrl || backendData.gstNumber)) {
          // If local has custom companies, merge them
          const mergedCompanies = localCompanies.length > 0
            ? localCompanies
            : [backendData];
          return NextResponse.json({
            ...backendData,
            companies: mergedCompanies,
          }, { headers: CORS_HEADERS });
        }
      }
    } catch (_) {}

    return NextResponse.json({
      ...localProfile,
      companies: localCompanies,
    }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to get seller profile' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const current = getLocalSellerProfile();

    if (Array.isArray(body.companies) && body.companies.length > 0) {
      saveLocalSellerCompanies(body.companies);
    }

    const updated: SellerProfile = {
      ...current,
      ...(body.id ? { id: body.id } : {}),
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.address !== undefined ? { address: body.address } : {}),
      ...(body.gstNumber !== undefined ? { gstNumber: body.gstNumber } : {}),
      ...(body.panNumber !== undefined ? { panNumber: body.panNumber } : {}),
      bankDetails: body.bankDetails
        ? { ...current.bankDetails, ...body.bankDetails }
        : current.bankDetails,
      updatedAt: new Date().toISOString(),
    };

    saveLocalSellerProfile(updated);

    // Also forward to NestJS backend if reachable
    try {
      const authHeader = req.headers.get('Authorization');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      await fetch(`${apiBase}/organizations/seller-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(updated),
      }).catch(() => null);
    } catch (_) {}

    const allCompanies = getLocalSellerCompanies();
    return NextResponse.json({
      ...updated,
      companies: allCompanies,
    }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update seller profile' }, { status: 500, headers: CORS_HEADERS });
  }
}
