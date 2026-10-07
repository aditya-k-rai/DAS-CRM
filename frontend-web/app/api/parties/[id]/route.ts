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

    const updated: SavedParty = {
      id,
      name: body.name ? body.name.trim() : (existing?.name || 'Party Client'),
      contactPerson: body.contactPerson !== undefined ? body.contactPerson : (existing?.contactPerson || ''),
      email: body.email !== undefined ? body.email : (existing?.email || ''),
      phone: body.phone !== undefined ? body.phone : (existing?.phone || ''),
      address: body.address !== undefined ? body.address : (existing?.address || 'Billed To Address'),
      shippingAddress: body.shippingAddress !== undefined ? body.shippingAddress : (existing?.shippingAddress || ''),
      gstNo: body.gstNo !== undefined ? body.gstNo : (existing?.gstNo || ''),
      panNo: body.panNo !== undefined ? body.panNo : (existing?.panNo || ''),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const next = existing ? current.map(p => p.id === id ? updated : p) : [updated, ...current];
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
