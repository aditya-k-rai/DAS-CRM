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

export async function GET() {
  try {
    const local = getLocalProducts();
    let firestoreProducts: any[] = [];
    try {
      firestoreProducts = await getProductsFromFirestore();
    } catch (_) {}

    if (firestoreProducts && firestoreProducts.length > 0) {
      const fsIds = new Set(firestoreProducts.map((p: any) => p.id));
      const combined = [
        ...firestoreProducts,
        ...local.filter(d => !fsIds.has(d.id)),
      ];
      return NextResponse.json(combined, { headers: CORS_HEADERS });
    }

    return NextResponse.json(local, { headers: CORS_HEADERS });
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentProducts = getLocalProducts();
    const nextList = [newProduct, ...currentProducts.filter(p => p.id !== id)];
    saveLocalProducts(nextList);

    try {
      await upsertProductInFirestore(id, newProduct);
    } catch (_) {}

    return NextResponse.json(newProduct, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500, headers: CORS_HEADERS });
  }
}
