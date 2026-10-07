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
    const dataUrl = body.dataUrl || body.imageData || body.image || body.base64 || '';
    const fileName = body.fileName || body.filename || `product_img_${Date.now()}`;
    const docId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let finalUrl = dataUrl;

    // 1. If base64 dataUrl is provided, write it to disk in public/products so client gets a clean, fast static URL!
    if (dataUrl && dataUrl.startsWith('data:')) {
      try {
        const matches = dataUrl.match(/^data:([A-Za-z0-9-+.\\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1].toLowerCase();
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : mimeType.includes('gif') ? 'gif' : mimeType.includes('svg') ? 'svg' : 'jpg';
          const cleanName = `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.${ext}`;

          // Target directories: public/products and backend storage
          const targetDirs = [
            path.resolve(process.cwd(), 'public', 'products'),
            path.resolve(process.cwd(), 'frontend-web', 'public', 'products'),
            path.resolve(process.cwd(), '..', 'frontend-web', 'public', 'products'),
            path.resolve(process.cwd(), '..', 'backend', 'public', 'products'),
            path.resolve(process.cwd(), '..', 'backend', 'storage', 'drive_vault', 'products'),
            path.resolve(process.cwd(), 'storage', 'drive_vault', 'products'),
          ];

          // Track if at least one disk write succeeded
          let diskWriteSucceeded = false;
          for (const dir of targetDirs) {
            try {
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync(path.join(dir, cleanName), buffer);
              diskWriteSucceeded = true;
            } catch (_) {}
          }

          // Only use the static file URL if disk write actually worked.
          // In read-only environments (Vercel/Render), fall back to the original
          // base64 data URL so images still display and embed in PDFs correctly.
          if (diskWriteSucceeded) {
            finalUrl = `/products/${cleanName}`;
          } else {
            // Keep the original dataUrl – it will always work client-side and in jsPDF addImage()
            finalUrl = dataUrl;
          }
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
