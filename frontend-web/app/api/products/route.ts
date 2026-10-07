import { NextResponse } from 'next/server';
import { getProductsFromFirestore, upsertProductInFirestore } from '@/lib/serverFirestore';
import { getLocalProducts, saveLocalProducts } from '@/lib/serverProducts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-organization-id',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  try {
    const local = getLocalProducts();
    const seenIds = new Set<string>();
    const seenSkus = new Set<string>();
    const combined: any[] = [];

    // 1. Add local products
    for (const p of local) {
      const id = p.id;
      const sku = (p.sku || '').toUpperCase();
      if (id) seenIds.add(id);
      if (sku) seenSkus.add(sku);
      combined.push(p);
    }

    // 2. Try fetching from NestJS backend
    try {
      const authHeader = req.headers.get('Authorization');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const backendRes = await fetch(`${apiBase}/products`, {
        headers: authHeader ? { Authorization: authHeader } : {},
        cache: 'no-store',
      }).catch(() => null);

      if (backendRes && backendRes.ok) {
        const backendData = await backendRes.json();
        if (Array.isArray(backendData)) {
          for (const bp of backendData) {
            const id = bp.id;
            const sku = (bp.sku || '').toUpperCase();
            if ((!id || !seenIds.has(id)) && (!sku || !seenSkus.has(sku))) {
              if (id) seenIds.add(id);
              if (sku) seenSkus.add(sku);
              combined.push(bp);
            }
          }
        }
      }
    } catch (_) {}

    // 3. Try fetching from Firestore
    try {
      const firestoreProducts = await getProductsFromFirestore();
      if (Array.isArray(firestoreProducts)) {
        for (const fp of firestoreProducts) {
          const id = fp.id;
          const sku = (fp.sku || '').toUpperCase();
          if ((!id || !seenIds.has(id)) && (!sku || !seenSkus.has(sku))) {
            if (id) seenIds.add(id);
            if (sku) seenSkus.add(sku);
            combined.push(fp);
          }
        }
      }
    } catch (_) {}

    return NextResponse.json(combined, { headers: CORS_HEADERS });
  } catch (_) {
    return NextResponse.json(getLocalProducts(), { headers: CORS_HEADERS });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id || `p-${Date.now()}`;
    const newProduct = {
      ...body,
      id,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentProducts = getLocalProducts();
    const nextList = [newProduct, ...currentProducts.filter(p => p.id !== id && p.sku !== newProduct.sku)];
    saveLocalProducts(nextList);

    // Forward to NestJS backend if reachable
    try {
      const authHeader = req.headers.get('Authorization');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const backendRes = await fetch(`${apiBase}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(newProduct),
      }).catch(() => null);

      if (backendRes && backendRes.ok) {
        const savedData = await backendRes.json();
        if (savedData?.id) {
          newProduct.id = savedData.id;
          saveLocalProducts([newProduct, ...currentProducts.filter(p => p.id !== id && p.id !== savedData.id)]);
        }
      }
    } catch (_) {}

    try {
      await upsertProductInFirestore(id, newProduct);
    } catch (_) {}

    return NextResponse.json(newProduct, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500, headers: CORS_HEADERS });
  }
}
