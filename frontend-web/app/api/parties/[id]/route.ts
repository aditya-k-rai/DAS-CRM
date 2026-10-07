import { NextResponse } from 'next/server';
import { getLocalParties, saveLocalParties, SavedParty } from '@/lib/serverSellerParties';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const parties = getLocalParties();
    const party = parties.find(p => p.id === id);
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404, headers: CORS_HEADERS });
    }
    return NextResponse.json(party, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const current = getLocalParties();
    const existing = current.find(p => p.id === id);

    if (!existing) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404, headers: CORS_HEADERS });
    }

    const updated: SavedParty = {
      ...existing,
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.contactPerson !== undefined ? { contactPerson: body.contactPerson } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.address !== undefined ? { address: body.address } : {}),
      ...(body.shippingAddress !== undefined ? { shippingAddress: body.shippingAddress } : {}),
      ...(body.gstNo !== undefined ? { gstNo: body.gstNo } : {}),
      ...(body.panNo !== undefined ? { panNo: body.panNo } : {}),
      updatedAt: new Date().toISOString(),
    };

    const next = current.map(p => p.id === id ? updated : p);
    saveLocalParties(next);
    return NextResponse.json(updated, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const current = getLocalParties();
    const next = current.filter(p => p.id !== id);
    saveLocalParties(next);
    return NextResponse.json({ success: true }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
