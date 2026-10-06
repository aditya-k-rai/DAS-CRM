import { NextResponse } from 'next/server';

// Serverless in-memory persistence across warm invocations
const serverlessQuotesCache: any[] = [];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-organization-id',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  return NextResponse.json(serverlessQuotesCache, { headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || `sq-${Date.now()}`;
    const quoteNumber = body.quoteNumber || body.docNo || `DOC-${Date.now()}`;
    
    const newRecord = {
      ...body,
      id,
      quoteNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = serverlessQuotesCache.findIndex(
      q => q.id === id || (q.quoteNumber && q.quoteNumber === quoteNumber)
    );

    if (existingIndex >= 0) {
      serverlessQuotesCache[existingIndex] = { ...serverlessQuotesCache[existingIndex], ...newRecord };
    } else {
      serverlessQuotesCache.unshift(newRecord);
    }

    return NextResponse.json(newRecord, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save quotation' }, { status: 500, headers: CORS_HEADERS });
  }
}
