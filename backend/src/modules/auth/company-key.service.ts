import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { KeyStatus, PlanTier } from '@prisma/client';

export interface GenerateCompanyKeyOptions {
  companyName: string;
  superAdminId: string;
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

  /** Generate a company registration key in format: ACME-KX-7421 */
  async generateCompanyKey(opts: GenerateCompanyKeyOptions) {
    const key = this.buildCompanyKeyString(opts.companyName);
    const qrCodeDataUrl = await QRCode.toDataURL(key, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: { dark: '#6366f1', light: '#ffffff' },
    });

    const expiresAt = new Date(
      Date.now() + opts.validityDays * 24 * 60 * 60 * 1000,
    );

    const record = await this.prisma.companyRegistrationKey.create({
      data: {
        key,
        qrCodeDataUrl,
        createdBySuperAdminId: opts.superAdminId,
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

  /** Generate a staff user invite key in format: ACME-RX-4312 */
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

  // ── Private Helpers ───────────────────────────────────────────────────

  private buildCompanyKeyString(companyName: string): string {
    // Extract initials (up to 4 chars) from company name
    const initials = companyName
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 4);

    const alpha = this.randomAlpha(2);
    const digits = this.randomDigits(4);
    return `${initials}-${alpha}-${digits}`;
  }

  private buildUserKeyString(orgName: string): string {
    const initials = orgName
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 3);

    const alpha = this.randomAlpha(2);
    const digits = this.randomDigits(4);
    return `${initials}-${alpha}-${digits}`;
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
