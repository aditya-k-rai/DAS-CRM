import { NextResponse } from 'next/server';
import { getLocalSellerProfile, saveLocalSellerProfile, SellerProfile } from '@/lib/serverSellerParties';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET() {
  try {
    const profile = getLocalSellerProfile();
    return NextResponse.json(profile, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to get seller profile' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const current = getLocalSellerProfile();

    const updated: SellerProfile = {
      ...current,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
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
    return NextResponse.json(updated, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update seller profile' }, { status: 500, headers: CORS_HEADERS });
  }
}
