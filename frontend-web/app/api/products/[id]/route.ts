import { NextResponse } from 'next/server';
import { upsertProductInFirestore } from '@/lib/serverFirestore';
import { getLocalProducts, saveLocalProducts } from '@/lib/serverProducts';

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
    const currentProducts = getLocalProducts();
    const found = currentProducts.find(p => p.id === id || (p.sku && p.sku.toUpperCase() === id.toUpperCase()));
    if (!found) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404, headers: CORS_HEADERS });
    }
    return NextResponse.json(found, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updatedProduct = {
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    // 1. Persist directly to local products.json storage
    const currentProducts = getLocalProducts();
    const existsIndex = currentProducts.findIndex(p => p.id === id || (p.sku && updatedProduct.sku && p.sku.toUpperCase() === updatedProduct.sku.toUpperCase()));
    let nextList: any[];
    if (existsIndex !== -1) {
      nextList = [...currentProducts];
      nextList[existsIndex] = { ...nextList[existsIndex], ...updatedProduct };
    } else {
      nextList = [updatedProduct, ...currentProducts];
    }
    saveLocalProducts(nextList);

    // 2. Forward to NestJS backend if reachable
    try {
      const authHeader = req.headers.get('Authorization');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      await fetch(`${apiBase}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(updatedProduct),
      }).catch(() => null);
    } catch (_) {}

    // 3. Persist directly to Google Cloud Firestore if connected
    try {
      await upsertProductInFirestore(id, updatedProduct);
    } catch (_) {}

    return NextResponse.json(updatedProduct, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update product' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const currentProducts = getLocalProducts();
    const nextList = currentProducts.filter(p => p.id !== id && p.sku !== id);
    saveLocalProducts(nextList);

    // Forward to NestJS backend if reachable
    try {
      const authHeader = req.headers.get('Authorization');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      await fetch(`${apiBase}/products/${id}`, {
        method: 'DELETE',
        headers: authHeader ? { Authorization: authHeader } : {},
      }).catch(() => null);
    } catch (_) {}

    return NextResponse.json({ success: true, id }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete product' }, { status: 500, headers: CORS_HEADERS });
  }
}
