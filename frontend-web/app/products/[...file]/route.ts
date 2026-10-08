import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'public, max-age=31536000, immutable',
};

const DEFAULT_FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase().replace('.', '');
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return 'image/jpeg';
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ file: string[] }> }
) {
  try {
    const { file } = await params;
    const joinedPath = Array.isArray(file) ? file.join('/') : String(file || '');
    const decodedPath = decodeURIComponent(joinedPath).replace(/^\/+/, '');
    const baseName = path.basename(decodedPath);

    const candidatePaths = [
      path.resolve(process.cwd(), 'public', 'products', baseName),
      path.resolve(process.cwd(), 'frontend-web', 'public', 'products', baseName),
      path.resolve(process.cwd(), '..', 'frontend-web', 'public', 'products', baseName),
      path.resolve(process.cwd(), '..', 'backend', 'public', 'products', baseName),
      path.resolve(process.cwd(), 'storage', 'drive_vault', 'products', baseName),
      path.resolve(process.cwd(), '..', 'storage', 'drive_vault', 'products', baseName),
      path.resolve(process.cwd(), 'public', decodedPath),
      path.resolve(process.cwd(), '..', 'backend', 'storage', 'drive_vault', decodedPath),
    ];

    for (const candidate of candidatePaths) {
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          const buffer = fs.readFileSync(candidate);
          const mime = getMimeType(candidate);
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              'Content-Type': mime,
              'Content-Length': buffer.length.toString(),
            },
          });
        }
      } catch (_) {}
    }

    // Fallback: try fetching from backend vault
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const backendUrl = `${apiBase}/storage/files/vault/${encodeURIComponent(decodedPath)}`;
      const res = await fetch(backendUrl, { cache: 'no-store' }).catch(() => null);
      if (res && res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const mime = res.headers.get('Content-Type') || getMimeType(baseName);
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': mime,
            'Content-Length': buffer.length.toString(),
          },
        });
      }
    } catch (_) {}

    return new NextResponse(DEFAULT_FALLBACK_SVG, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'image/svg+xml',
      },
    });
  } catch (_) {
    return new NextResponse(DEFAULT_FALLBACK_SVG, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'image/svg+xml',
      },
    });
  }
}
