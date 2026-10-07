import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase().replace('.', '');
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'pdf') return 'application/pdf';
  return 'image/jpeg';
}

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  @Get('files/vault/:path(*)')
  @ApiOperation({ summary: 'Serve storage vault files and product images' })
  serveVaultFile(@Param('path') rawPath: string, @Res() res: any) {
    const decodedPath = decodeURIComponent(rawPath || '').replace(/^\/+/, '');
    const baseName = path.basename(decodedPath);

    const candidatePaths = [
      path.resolve(process.cwd(), 'public', 'products', baseName),
      path.resolve(process.cwd(), '..', 'frontend-web', 'public', 'products', baseName),
      path.resolve(process.cwd(), 'storage', 'drive_vault', decodedPath),
      path.resolve(process.cwd(), '..', 'storage', 'drive_vault', decodedPath),
      path.resolve(process.cwd(), 'public', decodedPath),
    ];

    for (const cand of candidatePaths) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        const mime = getMimeType(cand);
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.sendFile(cand);
      }
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(HttpStatus.OK).send(DEFAULT_FALLBACK_SVG);
  }
}
