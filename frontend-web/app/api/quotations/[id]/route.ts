import { NextResponse } from 'next/server';
import { getLocalQuotes, upsertLocalQuote, deleteLocalQuote } from '@/lib/serverQuotes';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-organization-id',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const quotes = getLocalQuotes();
    const quote = quotes.find(q => q.id === id || q.docNo === id || q.quoteNumber === id);
    if (!quote) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404, headers: CORS_HEADERS });
    }
    return NextResponse.json(quote, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const current = getLocalQuotes();
    const existing = current.find(q => q.id === id || q.docNo === id || q.quoteNumber === id);

    const updated = {
      ...(existing || {}),
      ...body,
      id: existing?.id || id,
      updatedAt: new Date().toISOString(),
    };

    upsertLocalQuote(updated);

    // Also forward to NestJS backend if reachable
    try {
      const authHeader = req.headers.get('Authorization');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      await fetch(`${apiBase}/quotations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(updated),
      }).catch(() => null);
    } catch (_) {}

    return NextResponse.json(updated, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update quotation' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteLocalQuote(id);

    // Also delete in NestJS backend if reachable
    try {
      const authHeader = req.headers.get('Authorization');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      await fetch(`${apiBase}/quotations/${id}`, {
        method: 'DELETE',
        headers: authHeader ? { Authorization: authHeader } : {},
      }).catch(() => null);
    } catch (_) {}

    return NextResponse.json({ success: true, id }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete quotation' }, { status: 500, headers: CORS_HEADERS });
  }
}
