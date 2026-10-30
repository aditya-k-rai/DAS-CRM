import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ file: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePathArray = resolvedParams.file || [];
    const fileName = filePathArray.join('/');

    if (!fileName) {
      return new NextResponse('Bad request', { status: 400 });
    }

    // Candidate directories to search across frontend, backend, and vault storage
    const candidateDirs = [
      path.resolve(process.cwd(), 'public', 'products'),
      path.resolve(process.cwd(), '..', 'frontend-web', 'public', 'products'),
      path.resolve(process.cwd(), '..', 'backend', 'public', 'products'),
      path.resolve(process.cwd(), '..', 'backend', 'storage', 'drive_vault', 'products'),
      path.resolve(process.cwd(), 'storage', 'drive_vault', 'products'),
    ];

    // 1. Direct file match
    for (const dir of candidateDirs) {
      try {
        const fullPath = path.join(/*turbopackIgnore: true*/ dir, fileName);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
          const buffer = fs.readFileSync(fullPath);
          const ext = path.extname(fullPath).toLowerCase();
          const contentType =
            ext === '.png'
              ? 'image/png'
              : ext === '.webp'
              ? 'image/webp'
              : ext === '.svg'
              ? 'image/svg+xml'
              : 'image/jpeg';

          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }
      } catch (_) {}
    }

    // 2. Fallback: If requesting jacket or product gallery asset, serve puff-jackets.jpg
    if (fileName.includes('jacket') || fileName.includes('product-gallery')) {
      for (const dir of candidateDirs) {
        try {
          const puffPath = path.join(/*turbopackIgnore: true*/ dir, 'puff-jackets.jpg');
          if (fs.existsSync(puffPath) && fs.statSync(puffPath).isFile()) {
            const buffer = fs.readFileSync(puffPath);
            return new NextResponse(buffer, {
              headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
              },
            });
          }
        } catch (_) {}
      }
    }

    return new NextResponse('Image not found', { status: 404 });
  } catch (err: any) {
    return new NextResponse(err?.message || 'Server error', { status: 500 });
  }
}
