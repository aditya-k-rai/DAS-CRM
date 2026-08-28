import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const PDFDocument = require('pdfkit') as typeof import('pdfkit');
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class ActivityExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a PDF of the user's activity log for their old role period,
   * save to local storage (or Supabase Storage if configured),
   * and store the record in ActivityExportLog.
   */
  async exportUserActivityPdf(
    userId: string,
    organizationId: string,
    roleTransitionId: string,
    userName: string,
    oldRole: string,
  ) {
    // 1. Fetch all user activities
    const activities = await this.prisma.activity.findMany({
      where: { organizationId, userId },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // 2. Generate PDF in memory as buffer
    const pdfBuffer = await this.generatePdfBuffer(
      userName,
      oldRole,
      activities,
    );

    // 3. Save to /tmp folder (in production, upload to Supabase Storage)
    const fileName = `activity_export_${userId}_${Date.now()}.pdf`;
    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const filePath = path.join(exportDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    // 4. Build a 7-day download expiry URL
    //    In production: upload to Supabase Storage + generate presigned URL
    //    For now: use a signed local download token
    const downloadToken = crypto.randomBytes(32).toString('hex');
    const downloadExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const downloadUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/api/v1/role-transition/export/${downloadToken}`;

    // 5. Store in DB
    const exportLog = await this.prisma.activityExportLog.create({
      data: {
        roleTransitionId,
        userId,
        organizationId,
        storagePath: filePath,
        downloadUrl,
        downloadExpiresAt,
        activitiesCount: activities.length,
        sentToUserEmail: false,
        sentToAdminEmail: false,
      },
    });

    return exportLog;
  }

  private generatePdfBuffer(
    userName: string,
    oldRole: string,
    activities: any[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Header ────────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 80).fill('#6366f1');

      doc
        .fillColor('#ffffff')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('DAS CRM — Activity Export Report', 40, 25);

      doc
        .fillColor('#c7d2fe')
        .fontSize(10)
        .text(
          `Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
          40,
          52,
        );

      // ── User Info Section ──────────────────────────────────────
      doc.moveDown(3);
      doc
        .fillColor('#111827')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(`Employee: ${userName}`);

      doc
        .fillColor('#6b7280')
        .fontSize(11)
        .font('Helvetica')
        .text(`Previous Role: ${oldRole}`)
        .text(`Total Activities Exported: ${activities.length}`)
        .text(`Export Date: ${new Date().toDateString()}`);

      doc.moveDown();
      doc
        .moveTo(40, doc.y)
        .lineTo(doc.page.width - 40, doc.y)
        .stroke('#e5e7eb');
      doc.moveDown();

      // ── Activities Table ───────────────────────────────────────
      doc
        .fillColor('#111827')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Activity Log', { underline: true });
      doc.moveDown(0.5);

      if (activities.length === 0) {
        doc
          .fillColor('#6b7280')
          .fontSize(10)
          .font('Helvetica')
          .text('No activities found for this period.');
      } else {
        activities.forEach((act, idx) => {
          if (doc.y > doc.page.height - 100) doc.addPage();

          const date = new Date(act.createdAt).toLocaleDateString('en-IN');
          const time = new Date(act.createdAt).toLocaleTimeString('en-IN');

          doc
            .fillColor(idx % 2 === 0 ? '#f9fafb' : '#ffffff')
            .rect(40, doc.y, doc.page.width - 80, 28)
            .fill();

          doc
            .fillColor('#374151')
            .fontSize(9)
            .font('Helvetica-Bold')
            .text(`${idx + 1}. [${act.type}]`, 45, doc.y - 24, {
              continued: true,
            })
            .font('Helvetica')
            .text(`  ${act.description || 'No description'}`)
            .fillColor('#9ca3af')
            .fontSize(8)
            .text(`   ${date} at ${time}`, { indent: 10 });

          doc.moveDown(0.3);
        });
      }

      // ── Footer ─────────────────────────────────────────────────
      doc.moveDown(2);
      doc
        .fillColor('#9ca3af')
        .fontSize(8)
        .text(
          'This document is confidential and intended for authorized DAS CRM administrators only. Download link expires in 7 days.',
          { align: 'center' },
        );

      doc.end();
    });
  }
}
