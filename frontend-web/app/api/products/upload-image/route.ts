import { NextResponse } from 'next/server';
import { saveImageToFirestore } from '@/lib/serverFirestore';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const dataUrl = body.dataUrl || '';
    const fileName = body.fileName || `product_img_${Date.now()}`;
    const docId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Store image directly in Google Cloud Firestore collection 'product_images'
    const storedUrl = await saveImageToFirestore(docId, dataUrl, fileName);

    return NextResponse.json({
      success: true,
      url: storedUrl,
      fileName,
      docId,
    }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Image upload failed' }, { status: 500, headers: CORS_HEADERS });
  }
}
