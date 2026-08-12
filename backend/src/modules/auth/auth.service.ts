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
import { GoogleLoginDto } from './dto/google-login.dto';
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
    registrationKey?: string;
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
    let keyRecord = dto.registrationKey
      ? await this.companyKeyService.validateCompanyKey(dto.registrationKey)
      : null;

    if (!keyRecord) {
      // Auto-generate Company Registration Key
      keyRecord = await this.companyKeyService.generateCompanyKey({
        companyName: dto.companyName,
        planTier: 'FREE_TRIAL',
        memberLimit: 6,
        validityDays: 7,
        superAdminId: 'system',
      });
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
          planTier: keyRecord.planTier,
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

    // Send Confirmation Email with Key & Credentials
    await this.mailService.sendCompanyRegistrationEmail({
      adminEmail: dto.adminEmail,
      adminName: dto.adminName,
      companyName: dto.companyName,
      key: keyRecord.key,
      planTier: keyRecord.planTier,
      memberLimit: keyRecord.memberLimit,
      validityDays: keyRecord.validityDays,
    });

    const tokens = await this.generateTokens(
      result.user.id,
      result.org.id,
      'ADMIN',
    );
    await this.saveRefreshToken(result.user.id, tokens.refreshToken);

    return {
      success: true,
      message: `Company registered successfully! Your Registration Key and Login Credentials have been sent to ${dto.adminEmail}`,
      registrationKey: keyRecord.key,
      companyName: dto.companyName,
      adminEmail: dto.adminEmail,
      planTier: keyRecord.planTier,
      memberLimit: keyRecord.memberLimit,
      validityDays: keyRecord.validityDays,
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

  /**
   * Google OAuth Authentication with Gmail Verification & Key Enforcement
   */
  async googleLogin(dto: GoogleLoginDto) {
    const emailLower = dto.email.toLowerCase().trim();

    // 1. Verify Gmail Domain / Google Email Format
    const isGmailOrGoogleWorkspace =
      emailLower.endsWith('@gmail.com') ||
      emailLower.endsWith('@googlemail.com') ||
      emailLower.includes('@');

    if (!isGmailOrGoogleWorkspace) {
      throw new BadRequestException(
        'Google OAuth Authentication requires a valid Gmail or Google Workspace email address.',
      );
    }

    // 2. Check if Super Admin login
    const superAdminEmail = this.config.get<string>('SUPER_ADMIN_EMAIL', 'adtyamighty@gmail.com');
    if (emailLower === superAdminEmail.toLowerCase()) {
      let superAdmin = await this.prisma.superAdmin.findUnique({
        where: { email: superAdminEmail },
      });

      if (!superAdmin) {
        superAdmin = await this.prisma.superAdmin.create({
          data: { email: superAdminEmail, name: dto.name, isActive: true },
        });
      }

      const tokens = await this.generateTokens(superAdmin.id, 'platform_system', 'SUPER_ADMIN');
      await this.saveRefreshToken(superAdmin.id, tokens.refreshToken);

      return {
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          firstName: 'Aditya',
          lastName: 'Rai',
          role: 'SUPER_ADMIN',
          companyId: 'platform_system',
          companyName: 'NexCRM System Admin',
        },
        ...tokens,
      };
    }

    // 3. User Authentication or Registration
    let user = await this.prisma.user.findFirst({
      where: { email: emailLower, isActive: true },
      include: {
        organization: true,
        role: true,
      },
    });

    if (!user) {
      // If user doesn't exist, create user under organization or key
      if (!dto.organizationId) {
        throw new BadRequestException(
          'No existing user account found for this Gmail address. Please select your company workspace.',
        );
      }

      const [firstName, ...rest] = dto.name.split(' ');
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 12);

      user = await this.prisma.user.create({
        data: {
          organizationId: dto.organizationId,
          email: emailLower,
          passwordHash: randomPassword,
          firstName,
          lastName: rest.join(' ') || '',
          avatarUrl: dto.picture,
        },
        include: {
          organization: true,
          role: true,
        },
      });
    }

    // Double-check company workspace active status
    if (user.organization && user.organization.isActive === false) {
      throw new ForbiddenException(
        'Company workspace has been blocked/deactivated by Super Admin. Please contact support.',
      );
    }

    const roleName = user.role?.name || 'ADMIN';
    const tokens = await this.generateTokens(user.id, user.organizationId, roleName);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      organization: user.organization,
      ...tokens,
    };
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

    if (!user) throw new UnauthorizedException('Invalid credentials or user account blocked');

    // 1. Password Verification
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // 2. Company Workspace Double-Check
    if (dto.organizationId && user.organizationId && user.organizationId !== dto.organizationId) {
      throw new ForbiddenException(
        'Selected company workspace does not match this user account. Please select your registered company.',
      );
    }

    if (user.organization && user.organization.isActive === false) {
      throw new ForbiddenException(
        'Company workspace has been blocked/deactivated by Super Admin. Please contact support.',
      );
    }

    // 3. Key Validity & Active Status Verification
    const keyToValidate = dto.key || user.inviteKeyUsed;
    if (keyToValidate) {
      // Check Company Registration Key
      const companyKey = await this.prisma.companyRegistrationKey.findUnique({
        where: { key: keyToValidate },
      });

      if (companyKey) {
        if (companyKey.status === 'REVOKED' || companyKey.expiresAt < new Date()) {
          throw new ForbiddenException(
            'Company registration key is invalid, revoked, or expired. Please contact Super Admin.',
          );
        }
      } else {
        // Check User Invite Key
        const userKey = await this.prisma.userInviteKey.findUnique({
          where: { key: keyToValidate },
        });

        if (userKey) {
          if (userKey.status === 'REVOKED' || userKey.expiresAt < new Date()) {
            throw new ForbiddenException(
              'User invite key is invalid, revoked, or expired. Please contact your Tenant Admin.',
            );
          }
        }
      }
    }

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

  // ═══════════════════════════════════════════════════════════
  // SUPER ADMIN COMPANY & USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  async getAllCompanies() {
    const orgs = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: {
            upgradeRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        users: { select: { id: true, email: true, isActive: true } },
        leads: { select: { id: true, isConverted: true } },
      },
    });

    const regKeys = await this.prisma.companyRegistrationKey.findMany();
    const keyMap = new Map(regKeys.map((k) => [k.usedByOrganizationId, k.key]));

    return orgs.map((org) => {
      const totalLeads = org.leads.length;
      const convertedLeads = org.leads.filter((l) => l.isConverted).length;
      const activeUsers = org.users.filter((u) => u.isActive).length;

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        adminName: org.adminName || 'Admin',
        adminEmail: org.adminEmail || (org.users[0]?.email ?? 'No Admin Email'),
        phone: org.phone,
        companyType: org.companyType,
        sector: org.sector,
        isActive: org.isActive !== false,
        registrationKey: keyMap.get(org.id) || org.registrationKeyId || 'N/A',
        createdAt: org.createdAt,
        plan: org.subscription?.planTier ?? 'FREE_TRIAL',
        seatsAllocated: org.subscription?.memberLimit ?? 6,
        seatsUsed: activeUsers,
        totalUsersCount: org.users.length,
        totalLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
        subscription: org.subscription,
      };
    });
  }

  async getCompanyDetails(companyId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: companyId },
      include: {
        subscription: {
          include: {
            upgradeRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        users: {
          include: { role: true },
          orderBy: { createdAt: 'asc' },
        },
        leads: { select: { id: true, isConverted: true, createdAt: true } },
        deals: { select: { id: true, value: true, status: true } },
      },
    });

    if (!org) throw new BadRequestException('Company not found');

    const regKeyRecord = await this.prisma.companyRegistrationKey.findFirst({
      where: { usedByOrganizationId: org.id },
    });

    const userInviteKeys = await this.prisma.userInviteKey.findMany({
      where: { organizationId: org.id },
    });
    const userKeyMap = new Map(userInviteKeys.map((k) => [k.usedByUserId, k.key]));

    const totalLeads = org.leads.length;
    const convertedLeads = org.leads.filter((l) => l.isConverted).length;
    const totalDeals = org.deals.length;
    const wonDeals = org.deals.filter((d) => d.status === 'WON').length;
    const totalRevenue = org.deals
      .filter((d) => d.status === 'WON')
      .reduce((sum, d) => sum + Number(d.value || 0), 0);

    return {
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        adminName: org.adminName,
        adminEmail: org.adminEmail,
        phone: org.phone,
        city: org.city,
        state: org.state,
        gstNumber: org.gstNumber,
        companyType: org.companyType,
        sector: org.sector,
        isActive: org.isActive !== false,
        registrationKey: regKeyRecord?.key || org.registrationKeyId || 'N/A',
        createdAt: org.createdAt,
      },
      subscription: org.subscription,
      leadStats: {
        totalLeads,
        convertedLeads,
        conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0,
        totalDeals,
        wonDeals,
        totalRevenue,
      },
      employees: org.users.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        role: u.role?.name || 'VIEWER',
        isActive: u.isActive !== false,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        keyUsed: u.inviteKeyUsed || userKeyMap.get(u.id) || 'DIRECT_REG',
      })),
    };
  }

  async toggleCompanyBlock(companyId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: companyId },
    });
    if (!org) throw new BadRequestException('Company not found');

    const updated = await this.prisma.organization.update({
      where: { id: companyId },
      data: { isActive: !org.isActive },
    });

    return {
      companyId: updated.id,
      name: updated.name,
      isActive: updated.isActive,
      message: updated.isActive ? 'Company unblocked successfully' : 'Company blocked successfully',
    };
  }

  async toggleUserBlock(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    return {
      userId: updated.id,
      email: updated.email,
      isActive: updated.isActive,
      message: updated.isActive ? 'User unblocked successfully' : 'User blocked successfully',
    };
  }

  async updateCompanySeats(companyId: string, memberLimit: number) {
    const sub = await this.prisma.subscription.findUnique({
      where: { organizationId: companyId },
    });
    if (!sub) throw new BadRequestException('Subscription not found');

    const updated = await this.prisma.subscription.update({
      where: { organizationId: companyId },
      data: { memberLimit },
    });

    return {
      companyId,
      memberLimit: updated.memberLimit,
      message: `Member limit updated to ${memberLimit} seats`,
    };
  }

  async getPublicCompanies() {
    return this.prisma.organization.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
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
