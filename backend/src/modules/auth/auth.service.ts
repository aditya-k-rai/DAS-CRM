import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OtpService } from './otp.service';
import { CompanyKeyService } from './company-key.service';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private otpService: OtpService,
    private companyKeyService: CompanyKeyService,
    private mailService: MailService,
  ) {}

  // ═══════════════════════════════════════════════════════════
  // SUPER ADMIN AUTH FLOW
  // ═══════════════════════════════════════════════════════════

  /** Step 1: Validate email, send OTP to adtyamighty@gmail.com */
  async superAdminRequestOtp(email: string, ipAddress?: string) {
    const allowedEmail = this.config.get<string>(
      'SUPER_ADMIN_EMAIL',
      'adtyamighty@gmail.com',
    );

    if (email.toLowerCase() !== allowedEmail.toLowerCase()) {
      throw new ForbiddenException('Access denied: unauthorized email address');
    }

    let superAdmin = await this.prisma.superAdmin.findUnique({
      where: { email },
    });
    if (!superAdmin) {
      superAdmin = await this.prisma.superAdmin.create({
        data: { email, name: 'Super Admin' },
      });
    }

    if (!superAdmin.isActive) {
      throw new ForbiddenException('Super Admin account is deactivated');
    }

    const otp = await this.otpService.generateOtp(superAdmin.id, ipAddress);
    await this.mailService.sendSuperAdminOtp(email, otp);

    return {
      message: `OTP sent to ${email}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
    };
  }

  /** Step 2: Verify OTP → issue Super Admin JWT */
  async superAdminVerifyOtp(email: string, otp: string) {
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { email },
    });
    if (!superAdmin || !superAdmin.isActive)
      throw new ForbiddenException('Access denied');

    const valid = await this.otpService.verifyOtp(superAdmin.id, otp);
    if (!valid) throw new UnauthorizedException('Invalid or expired OTP');

    const accessToken = this.jwt.sign(
      { sub: superAdmin.id, role: 'SUPER_ADMIN', email: superAdmin.email },
      { expiresIn: '8h' },
    );

    return {
      accessToken,
      superAdmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════
  // COMPANY REGISTRATION (Tenant Admin)
  // ═══════════════════════════════════════════════════════════

  async registerCompanyWithKey(dto: {
    registrationKey: string;
    companyName: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    phone: string;
    city: string;
    state: string;
    gstNumber?: string;
    companyType?: string;
    sector?: string;
  }) {
    const keyRecord = await this.companyKeyService.validateCompanyKey(
      dto.registrationKey,
    );
    if (!keyRecord) {
      throw new BadRequestException(
        'Invalid, expired, or already used registration key',
      );
    }

    const existing = await this.prisma.user.findFirst({
      where: { email: dto.adminEmail },
    });
    if (existing) throw new ConflictException('Email already in use');

    const slug =
      dto.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now().toString(36);

    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.companyName,
          slug,
          adminName: dto.adminName,
          adminEmail: dto.adminEmail,
          phone: dto.phone,
          city: dto.city,
          state: dto.state,
          gstNumber: dto.gstNumber,
          companyType: dto.companyType,
          sector: dto.sector,
          registrationKeyId: keyRecord.id,
        },
      });

      const trialExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          planTier: 'FREE_TRIAL',
          memberLimit: keyRecord.memberLimit,
          trialExpiresAt,
          whatsAppEnabled: false,
          emailMarketingEnabled: false,
          aiEnabled: false,
        },
      });

      const adminRole = await tx.role.create({
        data: {
          organizationId: org.id,
          name: 'ADMIN',
          isSystem: true,
          recordScope: 'ALL',
        },
      });

      const statusDefs = [
        'New',
        'Contacted',
        'Qualified',
        'Proposal',
        'Negotiation',
        'Won',
        'Lost',
      ];
      const statusColors = [
        '#6366f1',
        '#f59e0b',
        '#3b82f6',
        '#8b5cf6',
        '#ec4899',
        '#22c55e',
        '#ef4444',
      ];
      await tx.leadStatus.createMany({
        data: statusDefs.map((name, i) => ({
          organizationId: org.id,
          name,
          color: statusColors[i],
          order: i,
          isDefault: i === 0,
          isWon: name === 'Won',
          isLost: name === 'Lost',
        })),
      });

      const pipeline = await tx.pipeline.create({
        data: {
          organizationId: org.id,
          name: 'Sales Pipeline',
          isDefault: true,
        },
      });
      await tx.stage.createMany({
        data: [
          {
            pipelineId: pipeline.id,
            name: 'Prospecting',
            order: 0,
            probability: 10,
            color: '#6366f1',
          },
          {
            pipelineId: pipeline.id,
            name: 'Qualification',
            order: 1,
            probability: 25,
            color: '#f59e0b',
          },
          {
            pipelineId: pipeline.id,
            name: 'Proposal',
            order: 2,
            probability: 50,
            color: '#3b82f6',
          },
          {
            pipelineId: pipeline.id,
            name: 'Negotiation',
            order: 3,
            probability: 75,
            color: '#8b5cf6',
          },
          {
            pipelineId: pipeline.id,
            name: 'Closed Won',
            order: 4,
            probability: 100,
            color: '#22c55e',
          },
        ],
      });

      const [firstName, ...rest] = dto.adminName.split(' ');
      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email: dto.adminEmail,
          passwordHash,
          firstName,
          lastName: rest.join(' ') || '',
          roleId: adminRole.id,
        },
      });

      return { org, user, adminRole };
    });

    await this.companyKeyService.markCompanyKeyUsed(
      keyRecord.id,
      result.org.id,
    );

    const tokens = await this.generateTokens(
      result.user.id,
      result.org.id,
      'ADMIN',
    );
    await this.saveRefreshToken(result.user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(result.user),
      organization: result.org,
      ...tokens,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // STAFF USER LOGIN (User Invite Key)
  // ═══════════════════════════════════════════════════════════

  async staffLoginWithKey(dto: {
    userKey: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const keyRecord = await this.companyKeyService.validateUserKey(dto.userKey);
    if (!keyRecord) {
      throw new BadRequestException(
        'Invalid, expired, or already used user invite key',
      );
    }

    const existing = await this.prisma.user.findFirst({
      where: { organizationId: keyRecord.organizationId, email: dto.email },
    });
    if (existing)
      throw new ConflictException('Email already registered in this workspace');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const roleRecord = await this.prisma.role.findFirst({
      where: {
        organizationId: keyRecord.organizationId,
        name: keyRecord.assignedRole,
      },
    });

    const [firstName, ...rest] = dto.name.split(' ');

    const user = await this.prisma.user.create({
      data: {
        organizationId: keyRecord.organizationId,
        email: dto.email,
        passwordHash,
        firstName,
        lastName: rest.join(' ') || '',
        roleId: roleRecord?.id ?? null,
      },
    });

    await this.companyKeyService.markUserKeyUsed(keyRecord.id, user.id);

    const tokens = await this.generateTokens(
      user.id,
      keyRecord.organizationId,
      keyRecord.assignedRole,
    );
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ═══════════════════════════════════════════════════════════
  // STANDARD TENANT ADMIN / STAFF LOGIN
  // ═══════════════════════════════════════════════════════════

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true },
      include: {
        organization: true,
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.organizationId,
      user.role?.name ?? 'VIEWER',
    );
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      organization: user.organization,
      ...tokens,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const slug =
      dto.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now().toString(36);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug,
          industry: dto.industry,
          subscription: { create: { planTier: 'FREE_TRIAL', memberLimit: 6 } },
        },
      });

      const ownerRole = await tx.role.create({
        data: {
          organizationId: org.id,
          name: 'ADMIN',
          isSystem: true,
          recordScope: 'ALL',
        },
      });

      const statusDefs = [
        'New',
        'Contacted',
        'Qualified',
        'Proposal',
        'Negotiation',
        'Won',
        'Lost',
      ];
      const statusColors = [
        '#6366f1',
        '#f59e0b',
        '#3b82f6',
        '#8b5cf6',
        '#ec4899',
        '#22c55e',
        '#ef4444',
      ];
      await tx.leadStatus.createMany({
        data: statusDefs.map((name, i) => ({
          organizationId: org.id,
          name,
          color: statusColors[i],
          order: i,
          isDefault: i === 0,
          isWon: name === 'Won',
          isLost: name === 'Lost',
        })),
      });

      const pipeline = await tx.pipeline.create({
        data: {
          organizationId: org.id,
          name: 'Sales Pipeline',
          isDefault: true,
        },
      });
      await tx.stage.createMany({
        data: [
          {
            pipelineId: pipeline.id,
            name: 'Prospecting',
            order: 0,
            probability: 10,
            color: '#6366f1',
          },
          {
            pipelineId: pipeline.id,
            name: 'Qualification',
            order: 1,
            probability: 25,
            color: '#f59e0b',
          },
          {
            pipelineId: pipeline.id,
            name: 'Proposal',
            order: 2,
            probability: 50,
            color: '#3b82f6',
          },
          {
            pipelineId: pipeline.id,
            name: 'Negotiation',
            order: 3,
            probability: 75,
            color: '#8b5cf6',
          },
          {
            pipelineId: pipeline.id,
            name: 'Closed Won',
            order: 4,
            probability: 100,
            color: '#22c55e',
          },
        ],
      });

      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          roleId: ownerRole.id,
        },
      });

      return { org, user, ownerRole };
    });

    const tokens = await this.generateTokens(
      result.user.id,
      result.org.id,
      result.ownerRole.name,
    );
    await this.saveRefreshToken(result.user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(result.user),
      organization: result.org,
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      include: { role: true },
    });
    if (!user || !user.isActive)
      throw new UnauthorizedException('User not found');

    await this.prisma.refreshToken.delete({ where: { token } });

    const tokens = await this.generateTokens(
      user.id,
      user.organizationId,
      user.role?.name ?? 'VIEWER',
    );
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string, token: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId, token } });
  }

  private async generateTokens(
    userId: string,
    organizationId: string,
    role: string,
  ) {
    const payload = { sub: userId, org_id: organizationId, role };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m') as any,
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, mfaSecret, ...safe } = user;
    return safe;
  }
}
