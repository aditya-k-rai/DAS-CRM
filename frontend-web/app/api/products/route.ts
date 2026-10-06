import { NextResponse } from 'next/server';
import { getProductsFromFirestore, upsertProductInFirestore } from '@/lib/serverFirestore';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-organization-id',
};

const DEFAULT_CATALOG = [
  {
    id: 'p-colour-tribe-jackets',
    name: 'Colour Tribe Puff Jackets',
    sku: 'DAS-570687',
    category: 'Jackets',
    subCategory: 'Puff Jackets',
    brand: 'Generic / Unbranded',
    color: 'Silver Grey, Black',
    unit: 'Pieces (Pcs)',
    price: 999,
    stock: 100,
    minOrderQty: 1,
    rating: 5.0,
    sharedCount: 12,
    sold: 0,
    taxRate: 18,
    isActive: true,
    coverImage: '/products/puff-jackets.jpg',
    imageUrl: '/products/puff-jackets.jpg',
    images: ['/products/puff-jackets.jpg'],
    overview: 'Premium Padded Colour Tribe Puff Jackets with lightweight thermal insulation and dual zip pockets.',
    description: 'Premium Padded Colour Tribe Puff Jackets with lightweight thermal insulation and dual zip pockets.',
    specs: ['Padded', 'Lightweight', 'Thermal Insulation'],
    features: ['Padded', 'Lightweight', 'Thermal Insulation'],
    volumeDiscounts: [
      { tier: '1 - 9 Units', minQty: 1, discountPct: 0, finalPrice: 999 },
      { tier: '10+ Units', minQty: 10, discountPct: 15, finalPrice: 849 },
    ],
  },
];

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET() {
  try {
    const firestoreProducts = await getProductsFromFirestore();
    const firestoreIds = new Set(firestoreProducts.map((p: any) => p.id));
    const combined = [
      ...firestoreProducts,
      ...DEFAULT_CATALOG.filter(d => !firestoreIds.has(d.id)),
    ];
    return NextResponse.json(combined, { headers: CORS_HEADERS });
  } catch (_) {
    return NextResponse.json(DEFAULT_CATALOG, { headers: CORS_HEADERS });
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
    await upsertProductInFirestore(id, newProduct);
    return NextResponse.json(newProduct, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500, headers: CORS_HEADERS });
  }
}
