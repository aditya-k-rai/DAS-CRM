import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { KeyStatus, PlanTier } from '@prisma/client';

export interface GenerateCompanyKeyOptions {
  companyName: string;
  gstNumber?: string;
  panNumber?: string;
  superAdminId?: string;
  planTier: PlanTier;
  memberLimit: number;
  validityDays: number;
  whatsAppEnabled?: boolean;
  emailMarketingEnabled?: boolean;
  aiEnabled?: boolean;
}

export interface GenerateUserKeyOptions {
  organizationId: string;
  organizationName: string;
  assignedRole: string;
  validityDays?: number;
}

@Injectable()
export class CompanyKeyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Generate a company registration key using rule-based format: e.g. ADO-EC-7187 */
  async generateCompanyKey(opts: GenerateCompanyKeyOptions) {
    const key = this.buildCompanyKeyString(opts.companyName, opts.gstNumber, opts.panNumber);
    const qrCodeDataUrl = await QRCode.toDataURL(key, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: { dark: '#6366f1', light: '#ffffff' },
    });

    const expiresAt = new Date(
      Date.now() + opts.validityDays * 24 * 60 * 60 * 1000,
    );

    let superAdmin = await this.prisma.superAdmin.findFirst({
      where: { email: 'adtyamighty@gmail.com' },
    });
    if (!superAdmin) {
      superAdmin = await this.prisma.superAdmin.create({
        data: {
          email: 'adtyamighty@gmail.com',
          name: 'Aditya Rai (Super Admin)',
          isActive: true,
        },
      });
    }
    const adminId = opts.superAdminId || superAdmin.id;

    const record = await this.prisma.companyRegistrationKey.create({
      data: {
        key,
        qrCodeDataUrl,
        createdBySuperAdminId: opts.superAdminId || superAdmin?.id || null,
        planTier: opts.planTier,
        memberLimit: opts.memberLimit,
        validityDays: opts.validityDays,
        whatsAppEnabled: opts.whatsAppEnabled ?? false,
        emailMarketingEnabled: opts.emailMarketingEnabled ?? false,
        aiEnabled: opts.aiEnabled ?? false,
        status: KeyStatus.ACTIVE,
        expiresAt,
      },
    });

    return record;
  }

  /** Generate a staff user invite key in format: DAS-RX-4312 */
  async generateUserKey(opts: GenerateUserKeyOptions) {
    const key = this.buildUserKeyString(opts.organizationName);
    const validityDays = opts.validityDays ?? 7;
    const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

    const record = await this.prisma.userInviteKey.create({
      data: {
        key,
        organizationId: opts.organizationId,
        assignedRole: opts.assignedRole as any,
        validityDays,
        status: KeyStatus.ACTIVE,
        expiresAt,
      },
    });

    return record;
  }

  /** Validate a company registration key — returns the key record or null */
  async validateCompanyKey(key: string) {
    const record = await this.prisma.companyRegistrationKey.findUnique({
      where: { key },
    });

    if (!record) return null;
    if (record.status !== KeyStatus.ACTIVE) return null;
    if (record.expiresAt < new Date()) return null;

    return record;
  }

  /** Validate a user invite key — returns the key record or null */
  async validateUserKey(key: string) {
    const record = await this.prisma.userInviteKey.findUnique({
      where: { key },
    });

    if (!record) return null;
    if (record.status !== KeyStatus.ACTIVE) return null;
    if (record.expiresAt < new Date()) return null;

    return record;
  }

  /** Mark a company key as USED */
  async markCompanyKeyUsed(keyId: string, organizationId: string) {
    await this.prisma.companyRegistrationKey.update({
      where: { id: keyId },
      data: {
        status: KeyStatus.USED,
        usedByOrganizationId: organizationId,
        usedAt: new Date(),
      },
    });
  }

  /** Mark a user invite key as USED */
  async markUserKeyUsed(keyId: string, userId: string) {
    await this.prisma.userInviteKey.update({
      where: { id: keyId },
      data: {
        status: KeyStatus.USED,
        usedByUserId: userId,
        usedAt: new Date(),
      },
    });
  }

  /** Get all company registration keys */
  async getAllCompanyKeys() {
    return this.prisma.companyRegistrationKey.findMany({
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
  }

  /** Get all user invite keys */
  async getAllUserKeys() {
    return this.prisma.userInviteKey.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get basic org info by ID (used for key validation display) */
  async getOrganizationById(orgId: string) {
    return this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, isActive: true },
    });
  }

  /** Revoke/Block a company registration key */
  async revokeCompanyKey(keyId: string) {
    return this.prisma.companyRegistrationKey.update({
      where: { id: keyId },
      data: { status: KeyStatus.REVOKED },
    });
  }

  /** Revoke/Block a user invite key */
  async revokeUserKey(keyId: string) {
    return this.prisma.userInviteKey.update({
      where: { id: keyId },
      data: { status: KeyStatus.REVOKED },
    });
  }

  // ── Private Helpers ───────────────────────────────────────────────────

  /**
   * Rule-based company registration key generation:
   * 1. First 3 letters of Company Name (e.g., "Adorable" -> "ADO")
   * 2. Next 2 letters from GST (e.g. from "09ECBPS7187H1ZY" -> "EC")
   * 3. Next 4 digits from GST (e.g. from "09ECBPS7187H1ZY" -> "7187")
   * Format: ADO-EC-7187 (11 characters)
   */
  buildCompanyKeyString(companyName?: string, gstNumber?: string, panNumber?: string): string {
    // 1. First 3 letters from Company Name
    const cleanName = (companyName || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
    const compPrefix = (cleanName.length >= 3 ? cleanName.slice(0, 3) : (cleanName + 'DAS').slice(0, 3));

    // 2. Two letters from GST (or PAN, or random fallback)
    const gstClean = (gstNumber || '').toUpperCase().trim();
    const panClean = (panNumber || '').toUpperCase().trim();

    const gstLetters = gstClean.replace(/[^A-Z]/g, '');
    const panLetters = panClean.replace(/[^A-Z]/g, '');

    let letterPart = '';
    if (gstLetters.length >= 2) {
      letterPart = gstLetters.slice(0, 2);
    } else if (panLetters.length >= 2) {
      letterPart = panLetters.slice(0, 2);
    } else {
      letterPart = this.randomAlpha(2);
    }

    // 3. Next 4 digits from GST (or PAN, or random fallback)
    let digitPart = '';
    const gstMatch4 = gstClean.match(/\d{4}/);
    const panMatch4 = panClean.match(/\d{4}/);

    if (gstMatch4) {
      digitPart = gstMatch4[0];
    } else if (panMatch4) {
      digitPart = panMatch4[0];
    } else {
      const allGstDigits = gstClean.replace(/\D/g, '');
      const allPanDigits = panClean.replace(/\D/g, '');
      if (allGstDigits.length >= 4) {
        digitPart = allGstDigits.slice(-4);
      } else if (allPanDigits.length >= 4) {
        digitPart = allPanDigits.slice(-4);
      } else {
        digitPart = this.randomDigits(4);
      }
    }

    return `${compPrefix}-${letterPart}-${digitPart}`;
  }

  /**
   * Rule-based staff user invite key generation:
   * Format: e.g. ADO-RX-4312 (11 characters)
   */
  buildUserKeyString(orgName?: string): string {
    const cleanName = (orgName || '').replace(/[^a-zA-Z]/g, '').toUpperCase();
    const compPrefix = (cleanName.length >= 3 ? cleanName.slice(0, 3) : (cleanName + 'DAS').slice(0, 3));
    const alpha = this.randomAlpha(2);
    const digits = this.randomDigits(4);
    return `${compPrefix}-${alpha}-${digits}`;
  }

  private randomAlpha(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // skip confusing chars O,I
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');
  }

  private randomDigits(length: number): string {
    return Math.floor(
      Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1),
    )
      .toString()
      .padStart(length, '0');
  }
}
