import { NextResponse } from 'next/server';
import { saveImageToFirestore } from '@/lib/serverFirestore';
import fs from 'fs';
import path from 'path';

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

    let finalUrl = dataUrl;

    // 1. If base64 dataUrl is provided, write it to disk in public/products so client gets a clean, fast static URL!
    if (dataUrl && dataUrl.startsWith('data:')) {
      try {
        const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
          const cleanName = `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.${ext}`;

          // Write to frontend-web/public/products
          const frontendPublicDir = path.resolve(process.cwd(), 'public', 'products');
          if (!fs.existsSync(frontendPublicDir)) {
            fs.mkdirSync(frontendPublicDir, { recursive: true });
          }
          fs.writeFileSync(path.join(frontendPublicDir, cleanName), buffer);

          // Also write to backend/public/products if present
          try {
            const backendPublicDir = path.resolve(process.cwd(), '..', 'backend', 'public', 'products');
            if (fs.existsSync(path.dirname(backendPublicDir))) {
              if (!fs.existsSync(backendPublicDir)) fs.mkdirSync(backendPublicDir, { recursive: true });
              fs.writeFileSync(path.join(backendPublicDir, cleanName), buffer);
            }
          } catch (_) {}

          finalUrl = `/products/${cleanName}`;
        }
      } catch (fileErr) {
        console.warn('[upload-image] Failed to write image to disk, falling back to dataUrl:', fileErr);
      }
    }

    // 2. Also register image in Firestore if token is available
    try {
      await saveImageToFirestore(docId, finalUrl, fileName);
    } catch (_) {}

    return NextResponse.json({
      success: true,
      url: finalUrl,
      fileName,
      docId,
    }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Image upload failed' }, { status: 500, headers: CORS_HEADERS });
  }
}
