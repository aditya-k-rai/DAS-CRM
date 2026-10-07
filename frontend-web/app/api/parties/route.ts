import { NextResponse } from 'next/server';
import { getLocalParties, saveLocalParties, SavedParty } from '@/lib/serverSellerParties';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET() {
  try {
    const parties = getLocalParties();
    return NextResponse.json(parties, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to get parties' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Party name is required' }, { status: 400, headers: CORS_HEADERS });
    }

    const id = body.id || `party-${Date.now()}`;
    const now = new Date().toISOString();
    const current = getLocalParties();

    const existing = current.find(p => p.id === id);
    const party: SavedParty = {
      id,
      name: body.name.trim(),
      contactPerson: body.contactPerson || '',
      email: body.email || '',
      phone: body.phone || '',
      address: body.address || '',
      shippingAddress: body.shippingAddress || '',
      gstNo: body.gstNo || '',
      panNo: body.panNo || '',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const next = [party, ...current.filter(p => p.id !== id)];
    saveLocalParties(next);
    return NextResponse.json(party, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create party' }, { status: 500, headers: CORS_HEADERS });
  }
}
