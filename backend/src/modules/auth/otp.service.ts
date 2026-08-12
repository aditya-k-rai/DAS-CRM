import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  /** Generate a 6-digit numeric OTP, store its bcrypt hash in DB, return plain OTP */
  async generateOtp(superAdminId: string, ipAddress?: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    const expiryMins = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
    const expiresAt = new Date(Date.now() + expiryMins * 60 * 1000);

    // Invalidate any existing unused OTPs for this admin
    await this.prisma.superAdminOtp.updateMany({
      where: { superAdminId, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.superAdminOtp.create({
      data: { superAdminId, otpHash, expiresAt, ipAddress },
    });

    return otp;
  }

  /** Verify a plain OTP against stored hash for this super admin */
  async verifyOtp(superAdminId: string, plainOtp: string): Promise<boolean> {
    const record = await this.prisma.superAdminOtp.findFirst({
      where: {
        superAdminId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) return false;

    const valid = await bcrypt.compare(plainOtp, record.otpHash);
    if (valid) {
      await this.prisma.superAdminOtp.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
    }
    return valid;
  }
}
