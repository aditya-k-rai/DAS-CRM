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

    // 2. Persist directly to Google Cloud Firestore if connected
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
    const nextList = currentProducts.filter(p => p.id !== id);
    saveLocalProducts(nextList);

    return NextResponse.json({ success: true, id }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete product' }, { status: 500, headers: CORS_HEADERS });
  }
}
