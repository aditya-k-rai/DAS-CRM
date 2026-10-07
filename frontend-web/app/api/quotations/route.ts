import { NextResponse } from 'next/server';
import { getQuotesFromFirestore, saveQuoteToFirestore } from '@/lib/serverFirestore';

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
  const combinedQuotes: any[] = [];
  const seenIds = new Set<string>();

  // 1. Try fetching from NestJS backend
  try {
    const authHeader = req.headers.get('Authorization');
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const backendRes = await fetch(`${apiBase}/quotations`, {
      headers: authHeader ? { Authorization: authHeader } : {},
      cache: 'no-store',
    }).catch(() => null);

    if (backendRes && backendRes.ok) {
      const backendData = await backendRes.json();
      if (Array.isArray(backendData)) {
        for (const item of backendData) {
          const key = item.quoteNumber || item.id;
          if (key && !seenIds.has(key)) {
            seenIds.add(key);
            combinedQuotes.push(item);
          }
        }
      }
    }
  } catch (_) {}

  // 2. Fetch from Google Cloud Firestore
  try {
    const firestoreQuotes = await getQuotesFromFirestore();
    if (Array.isArray(firestoreQuotes)) {
      for (const item of firestoreQuotes) {
        const key = item.quoteNumber || item.id || item.docNo;
        if (key && !seenIds.has(key)) {
          seenIds.add(key);
          combinedQuotes.push(item);
        }
      }
    }
  } catch (_) {}

  // 3. Fallback to in-memory serverless cache
  for (const item of serverlessQuotesCache) {
    const key = item.quoteNumber || item.id || item.docNo;
    if (key && !seenIds.has(key)) {
      seenIds.add(key);
      combinedQuotes.push(item);
    }
  }

  return NextResponse.json(combinedQuotes, { headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || `sq-${Date.now()}`;
    const quoteNumber = body.quoteNumber || body.docNo || `DOC-${Date.now()}`;
    const pdfUrl = body.pdfUrl || body.payload?.pdfUrl || '';

    const newRecord = {
      ...body,
      id,
      quoteNumber,
      pdfUrl,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Persist to Firestore invoices_pdfs collection
    try {
      await saveQuoteToFirestore(newRecord);
    } catch (fsErr) {
      console.warn('[Quotations API] Firestore save notice:', fsErr);
    }

    // 2. Forward to NestJS backend if reachable
    try {
      const authHeader = req.headers.get('Authorization');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const backendRes = await fetch(`${apiBase}/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(newRecord),
      }).catch(() => null);

      if (backendRes && backendRes.ok) {
        const backendResult = await backendRes.json();
        if (backendResult?.id) {
          newRecord.id = backendResult.id;
          if (backendResult.pdfUrl) {
            newRecord.pdfUrl = backendResult.pdfUrl;
          }
        }
      }
    } catch (_) {}

    // 3. Cache locally
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
