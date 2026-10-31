import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ model: string[] }> }
) {
  try {
    const { model } = await params;
    const modelName = Array.isArray(model) ? model.join('/') : String(model || '');
    const decodedName = decodeURIComponent(modelName);

    const candidatePaths = [
      path.join(process.cwd(), '..', 'backend', '3D asserts', decodedName),
      path.join(process.cwd(), 'public', 'models', decodedName),
      path.join(process.cwd(), 'backend', '3D asserts', decodedName),
    ];

    for (const filePath of candidatePaths) {
      try {
        if (fs.existsSync(/*turbopackIgnore: true*/ filePath) && fs.statSync(/*turbopackIgnore: true*/ filePath).isFile()) {
          const fileBuffer = fs.readFileSync(/*turbopackIgnore: true*/ filePath);
          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'model/gltf-binary',
              'Content-Disposition': `inline; filename="${path.basename(decodedName)}"`,
              'Cache-Control': 'public, max-age=86400, immutable',
            },
          });
        }
      } catch (_) {}
    }

    return new NextResponse(`Model "${decodedName}" not found`, { status: 404 });
  } catch (err: any) {
    return new NextResponse(err?.message || 'Server error loading 3D model', { status: 500 });
  }
}
