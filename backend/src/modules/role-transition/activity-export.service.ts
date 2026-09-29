import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FirestoreStorageService } from '../firestore/firestore-storage.service';
import { CloudStorageService } from '../firestore/cloud-storage.service';

const PDFDocument = require('pdfkit') as typeof import('pdfkit');
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class ActivityExportService {
  private readonly logger = new Logger(ActivityExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firestoreStorageService: FirestoreStorageService,
    private readonly cloudStorageService: CloudStorageService,
  ) {}

  /**
   * Generate a PDF of the user's activity log for their old role period,
   * save to Google Cloud Storage + Firestore metadata registry,
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

    const trackingId = `exp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const fileName = `activity_export_${userName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.pdf`;
    const objectPath = `vault/Exports/Activity_Logs/${trackingId}_${fileName}`;

    // 3. Save to Google Cloud Storage / Local Vault
    const { gcsPath, gcsDownloadUrl } = await this.cloudStorageService.uploadBuffer(
      pdfBuffer,
      objectPath,
      'application/pdf',
    );

    // 4. Generate 7-day signed download URL
    const downloadExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    let downloadUrl: string;
    try {
      downloadUrl = await this.cloudStorageService.generateSignedDownloadUrl(
        objectPath,
        fileName,
        7 * 24 * 60, // 7 days in minutes
      );
    } catch {
      downloadUrl = gcsDownloadUrl || `/api/v1/storage/download/${trackingId}`;
    }

    // 5. Index in Google Cloud Firestore
    await this.firestoreStorageService.saveFileRecord({
      fileId: trackingId,
      organizationId,
      companyName: 'Acme Sales Solutions',
      fileName,
      originalName: fileName,
      mimeType: 'application/pdf',
      fileExtension: 'pdf',
      sizeBytes: pdfBuffer.length,
      sizeFormatted: this.firestoreStorageService.formatBytes(pdfBuffer.length),
      category: 'DOCUMENTS',
      subCategory: 'Activity Export',
      employeeName: userName,
      folderHierarchy: ['Acme Sales Solutions', 'Documents', 'Activity Exports'],
      folderPath: 'Google Drive > Acme Sales Solutions > Documents > Activity Exports',
      storageEngines: {
        firestore: true,
        googleCloudStorage: true,
        googleDrive: false,
        localVault: true,
      },
      gcsPath,
      gcsDownloadUrl: downloadUrl,
      isProtectedKyc: false,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: downloadExpiresAt.toISOString(),
      isDeleted: false,
    });

    // 6. Store in Prisma DB
    const exportLog = await this.prisma.activityExportLog.create({
      data: {
        roleTransitionId,
        userId,
        organizationId,
        storagePath: gcsPath || objectPath,
        downloadUrl,
        downloadExpiresAt,
        activitiesCount: activities.length,
        sentToUserEmail: false,
        sentToAdminEmail: false,
      },
    });

    this.logger.log(`📄 Activity Export PDF archived in Cloud Storage & Firestore for ${userName} (${pdfBuffer.length} bytes)`);
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

      doc.on('data', (chunk: any) => chunks.push(chunk));
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

      doc.moveDown(1);
      doc
        .fontSize(10)
        .fillColor('#4b5563')
        .text('Generated by DAS CRM — ', { align: 'center', continued: true })
        .fillColor('#4f46e5')
        .text('www.dascrm.com', { link: 'https://dascrm.com', underline: true });

      doc.end();
    });
  }
}
