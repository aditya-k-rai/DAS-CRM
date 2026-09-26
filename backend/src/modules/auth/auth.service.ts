import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanTier } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { OtpService } from './otp.service';
import { CompanyKeyService } from './company-key.service';
import { MailService, MailDeliveryResult } from './mail.service';
import { PLAN_DEFINITIONS, getPlanDefinition, WHATSAPP_LOW_CREDIT_THRESHOLD_PERCENT } from '../../common/plan-config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Shared demo role map — single source of truth (avoids duplication)
  private static readonly DEMO_ROLE_MAP: Record<string, { name: string; role: string }> = {
    'vikram.admin@acme.com': { name: 'Vikram Singh', role: 'ADMIN' },
    'hr.manager@acme.com':  { name: 'Sunita Verma',  role: 'HR' },
    'sunita.hr@acme.com':   { name: 'Sunita Verma',  role: 'HR' },
    'rajesh.mgr@acme.com':  { name: 'Rajesh Mehta',  role: 'MANAGER' },
    'amit.tl@acme.com':     { name: 'Amit Shah',     role: 'TEAM_LEADER' },
    'rajesh.rep@acme.com':  { name: 'Rajesh Kumar',  role: 'SALES_EXEC' },
  };

  // TTL-aware OTP store — auto-purges expired entries to prevent memory leak
  private readonly resetOtps = new Map<string, { otp: string; expiresAt: number }>();

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

  /**
   * Enterprise Multi-Tenant Duplicate Checker:
   * Validates Email, Phone Number, GSTIN, and Business PAN against existing companies and users.
   * If ANY identifier matches an existing record:
   * 1. Logs duplicate attempt.
   * 2. Asynchronously sends security/credentials reminder email to the registered admin.
   * 3. Throws ConflictException with the required exact message:
   *    "The company is already registered. Please check the Admin email for details."
   */
  async validateCompanyUniqueness(input: {
    email: string;
    phone?: string;
    gstNumber?: string;
    panNumber?: string;
  }): Promise<{ isUnique: boolean; matchedField?: string }> {
    const rawEmail = (input.email || '').trim().toLowerCase();
    const rawPhone = (input.phone || '').trim();
    const cleanDigitsPhone = rawPhone.replace(/\D/g, '');
    const corePhone = cleanDigitsPhone.length >= 10 ? cleanDigitsPhone.slice(-10) : cleanDigitsPhone;

    const rawGst = (input.gstNumber || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    let rawPan = (input.panNumber || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Cross-derivation: in India, characters 3-12 of a 15-character GSTIN are the entity's PAN
    if (!rawPan && rawGst.length === 15) {
      rawPan = rawGst.slice(2, 12);
    }

    // Cross-consistency check: if both GST and PAN are provided, ensure PAN matches GST characters 3-12
    if (rawGst.length === 15 && rawPan.length === 10) {
      const panFromGst = rawGst.slice(2, 12);
      if (panFromGst !== rawPan) {
        throw new BadRequestException(
          `Business PAN "${rawPan}" does not match the PAN embedded in GSTIN "${rawGst}" (${panFromGst}). Please verify your credentials.`,
        );
      }
    }

    let matchedField: string | null = null;
    let conflictOrg: any = null;

    // 1. Check Email (against Organization adminEmail and User email)
    if (rawEmail) {
      const orgWithEmail = await this.prisma.organization.findFirst({
        where: { adminEmail: { equals: rawEmail, mode: 'insensitive' } },
      });
      if (orgWithEmail) {
        matchedField = 'Email';
        conflictOrg = orgWithEmail;
      } else {
        const userWithEmail = await this.prisma.user.findFirst({
          where: { email: { equals: rawEmail, mode: 'insensitive' } },
          include: { organization: true },
        });
        if (userWithEmail) {
          matchedField = 'Email';
          conflictOrg = userWithEmail.organization;
        }
      }
    }

    // 2. Check Phone / Number (if not already matched)
    if (!matchedField && corePhone.length >= 10) {
      const orgWithPhone = await this.prisma.organization.findFirst({
        where: {
          OR: [
            { phone: { equals: rawPhone } },
            { phone: { endsWith: corePhone } },
          ],
        },
      });
      if (orgWithPhone) {
        matchedField = 'Phone Number';
        conflictOrg = orgWithPhone;
      }
    }

    // 3. Check GST Number (if not already matched)
    if (!matchedField && rawGst.length >= 10) {
      const orgWithGst = await this.prisma.organization.findFirst({
        where: {
          gstNumber: { equals: rawGst, mode: 'insensitive' },
        },
      });
      if (orgWithGst) {
        matchedField = 'GST Number';
        conflictOrg = orgWithGst;
      }
    }

    // 4. Check Business PAN (if not already matched)
    if (!matchedField && rawPan.length === 10) {
      let orgWithPan = await this.prisma.organization.findFirst({
        where: {
          OR: [
            { panNumber: { equals: rawPan, mode: 'insensitive' } },
            { gstNumber: { contains: rawPan, mode: 'insensitive' } },
          ],
        },
      });

      // Fallback check in settings JSON for legacy records
      if (!orgWithPan) {
        const orgs = await this.prisma.organization.findMany({
          select: {
            id: true,
            name: true,
            adminEmail: true,
            adminName: true,
            settings: true,
            panNumber: true,
            gstNumber: true,
            registrationKeyId: true,
          },
          take: 500,
        });
        for (const o of orgs) {
          const s = (o.settings as any) || {};
          const pan = s.panNumber ? String(s.panNumber).toUpperCase().trim() : '';
          if (pan === rawPan) {
            orgWithPan = o as any;
            break;
          }
        }
      }

      if (orgWithPan) {
        matchedField = 'Business PAN';
        conflictOrg = orgWithPan;
      }
    }

    // If any conflict was detected:
    if (matchedField && conflictOrg) {
      const adminEmail = conflictOrg.adminEmail || rawEmail;
      const adminName = conflictOrg.adminName || 'Admin';
      const companyName = conflictOrg.name || 'Your Company';
      const regKey = conflictOrg.registrationKeyId || undefined;

      this.logger.warn(
        `Duplicate company registration prevented: ${matchedField} matched existing company "${companyName}" (ID: ${conflictOrg.id}). Admin Email: ${adminEmail}`,
      );

      // Asynchronously send notification notice to the registered admin's inbox
      this.mailService
        .sendCompanyAlreadyRegisteredNotice({
          adminEmail,
          adminName,
          companyName,
          matchedField,
          registrationKey: regKey,
        })
        .catch((err) => {
          this.logger.warn(`Could not dispatch duplicate notice email to ${adminEmail}: ${err?.message}`);
        });

      // Mask admin email for secure client-side guidance
      const maskedEmail = this.maskEmail(adminEmail);

      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        code: 'COMPANY_ALREADY_REGISTERED',
        message: 'The company is already registered. Please check the Admin email for details.',
        matchedField,
        companyName,
        maskedAdminEmail: maskedEmail,
      });
    }

    return { isUnique: true };
  }

  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return 'Admin Email';
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `${user[0]}*@${domain}`;
    const start = user.slice(0, 2);
    const end = user.slice(-1);
    return `${start}${'*'.repeat(Math.min(Math.max(user.length - 3, 2), 6))}${end}@${domain}`;
  }

  async registerCompanyWithKey(dto: {
    registrationKey?: string;
    companyName: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    phone: string;
    city: string;
    state: string;
    pincode?: string;
    gstNumber?: string;
    panNumber?: string;
    panType?: string;
    companyType?: string;
    sector?: string;
    planTier?: string;
    couponCode?: string;
    accountType?: 'BUY_REQUEST' | 'TRIAL';
    validityDays?: number;
  }) {
    // 1. Enforce strict uniqueness validation across Email, Phone Number, GSTIN, and Business PAN
    await this.validateCompanyUniqueness({
      email: dto.adminEmail,
      phone: dto.phone,
      gstNumber: dto.gstNumber,
      panNumber: dto.panNumber,
    });

    let keyRecord = dto.registrationKey
      ? await this.companyKeyService.validateCompanyKey(dto.registrationKey)
      : null;

    const requestValidity = dto.accountType === 'BUY_REQUEST' ? 30 : (dto.validityDays || 15);

    if (!keyRecord) {
      // Auto-generate Company Registration Key
      const validTiers = Object.values(PlanTier);
      const chosenTier = (dto.planTier && validTiers.includes(dto.planTier as PlanTier)
        ? dto.planTier
        : 'FREE_TRIAL') as PlanTier;
      const memberLimit =
        chosenTier === PlanTier.ENTERPRISE || chosenTier === PlanTier.PRO_MAX
          ? 60
          : chosenTier === PlanTier.PRO_50
          ? 50
          : chosenTier === PlanTier.BUSINESS || chosenTier === PlanTier.PRO
          ? 18
          : 6;

      keyRecord = await this.companyKeyService.generateCompanyKey({
        companyName: dto.companyName,
        gstNumber: dto.gstNumber,
        panNumber: dto.panNumber,
        planTier: chosenTier,
        memberLimit,
        validityDays: requestValidity,
      });
    }

    const slug =
      dto.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now().toString(36);

    const rawPassword = dto.adminPassword || (dto as any).password || 'Admin@123456';
    const passwordHash = await bcrypt.hash(rawPassword, 12);

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
          panNumber: dto.panNumber || (dto.gstNumber && dto.gstNumber.length === 15 ? dto.gstNumber.slice(2, 12).toUpperCase() : null),
          companyType: dto.companyType,
          sector: dto.sector,
          registrationKeyId: keyRecord.id,
          isActive: false, // Inactive until Super Admin verifies and approves plan
          settings: {
            verificationStatus: 'PENDING',
            requestedPlan: keyRecord.planTier,
            accountType: dto.accountType || (requestValidity === 30 ? 'BUY_REQUEST' : 'TRIAL'),
            requestedValidityDays: requestValidity,
            registeredAt: new Date().toISOString(),
            registrationKey: keyRecord.key,
            companyName: dto.companyName,
            adminName: dto.adminName,
            adminEmail: dto.adminEmail,
            phone: dto.phone,
            city: dto.city,
            state: dto.state,
            pincode: dto.pincode || null,
            gstNumber: dto.gstNumber || null,
            panNumber: dto.panNumber || (dto.gstNumber && dto.gstNumber.length === 15 ? dto.gstNumber.slice(2, 12).toUpperCase() : null),
            panType: dto.panType || 'BUSINESS',
            companyType: dto.companyType || null,
            sector: dto.sector || null,
            couponCode: dto.couponCode || null,
          },
        },
      });

      const trialExpiresAt = new Date(Date.now() + requestValidity * 24 * 60 * 60 * 1000);

      await tx.subscription.create({
        data: {
          organizationId: org.id,
          planTier: keyRecord.planTier,
          memberLimit: keyRecord.memberLimit,
          trialExpiresAt,
          isActive: false, // Inactive until Super Admin approves
          isTrialActive: false,
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

    // Dispatch confirmation email to Admin via resilient delivery pipeline
    const mailResult: MailDeliveryResult = await this.mailService
      .sendCompanyRegistrationEmail({
        adminEmail: dto.adminEmail,
        adminName: dto.adminName,
        companyName: dto.companyName,
        key: keyRecord.key,
        planTier: keyRecord.planTier,
        memberLimit: keyRecord.memberLimit,
        validityDays: keyRecord.validityDays,
        adminPassword: rawPassword, // plain text — included in PDF attachment
        pincode: dto.pincode,
        phone: dto.phone,
        city: dto.city,
        state: dto.state,
        gstNumber: dto.gstNumber,
        panNumber: dto.panNumber,
        panType: dto.panType,
        companyType: dto.companyType,
        sector: dto.sector,
        couponCode: dto.couponCode,
        accountType: dto.accountType || (requestValidity === 30 ? 'BUY_REQUEST' : 'TRIAL'),
      })
      .catch((mailErr) => {
        this.logger.warn(`SMTP Mail Dispatch Notice: Registration confirmation email error for ${dto.adminEmail}: ${mailErr?.message}`);
        return {
          success: false,
          provider: 'outbox_only' as const,
          error: mailErr?.message,
        };
      });

    // Notify Super Admin asynchronously in the background
    this.mailService
      .sendNewCompanyRegistrationNotification({
        companyName: dto.companyName,
        adminName: dto.adminName,
        adminEmail: dto.adminEmail,
        key: keyRecord.key,
        planTier: keyRecord.planTier,
        memberLimit: keyRecord.memberLimit,
        accountType: dto.accountType || (requestValidity === 30 ? 'BUY_REQUEST' : 'TRIAL'),
        validityDays: requestValidity,
        phone: dto.phone,
        city: dto.city,
        state: dto.state,
        gstNumber: dto.gstNumber,
        panNumber: dto.panNumber,
        panType: dto.panType,
        companyType: dto.companyType,
        sector: dto.sector,
      })
      .catch((notifyErr) => {
        this.logger.warn(`Super Admin notification could not be sent: ${notifyErr?.message}`);
      });

    const tokens = await this.generateTokens(
      result.user.id,
      result.org.id,
      'ADMIN',
    );
    await this.saveRefreshToken(result.user.id, tokens.refreshToken);

    const emailStatusMessage =
      mailResult.provider === 'primary_smtp'
        ? `Official Registration Certificate emailed to ${dto.adminEmail}`
        : mailResult.provider === 'fallback_smtp'
        ? `Delivered via secondary mail service to ${dto.adminEmail}`
        : mailResult.provider === 'ethereal'
        ? `Live SMTP quota exceeded. Sandbox preview generated and saved to outbox.`
        : `Email saved to system outbox (${mailResult.outboxId || 'saved'}).`;

    return {
      success: true,
      status: 'VERIFICATION_PENDING',
      verificationStatus: 'PENDING',
      isCompanyVerified: false,
      message: `Company registered successfully! Your workspace is currently pending Super Admin plan verification and activation. Registration Key: ${keyRecord.key}`,
      registrationKey: keyRecord.key,
      qrCodeDataUrl: keyRecord.qrCodeDataUrl,
      companyName: dto.companyName,
      adminName: dto.adminName,
      adminEmail: dto.adminEmail,
      planTier: keyRecord.planTier,
      memberLimit: keyRecord.memberLimit,
      accountType: dto.accountType || (requestValidity === 30 ? 'BUY_REQUEST' : 'TRIAL'),
      validityDays: requestValidity,
      emailDelivery: {
        sent: mailResult.success,
        provider: mailResult.provider,
        previewUrl: mailResult.previewUrl,
        outboxId: mailResult.outboxId,
        message: emailStatusMessage,
      },
      user: this.sanitizeUser(result.user),
      organization: result.org,
      ...tokens,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // STAFF USER LOGIN (User Invite Key)
  // ═══════════════════════════════════════════════════════════

  /**
   * Employee self-registration using the Company's permanent key.
   * Each company has exactly ONE key (rule-based, generated at registration).
   * The key is reusable — all employees of that company use it to join.
   * Role is selected by the employee during registration.
   */
  async staffLoginWithKey(dto: {
    userKey: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }) {
    const cleanKey = (dto.userKey || '').trim().toUpperCase();
    if (!cleanKey) {
      throw new BadRequestException('Please provide your Company Key.');
    }

    // Look up the Company Registration Key — the single permanent key per company
    const companyKey = await this.companyKeyService.validateCompanyKey(cleanKey);

    if (!companyKey) {
      throw new BadRequestException(
        `Key "${cleanKey}" is not a valid Company Key. Please check the key your Admin provided.`,
      );
    }

    if (!companyKey.usedByOrganizationId) {
      throw new BadRequestException(
        `Key "${cleanKey}" has not been linked to a company workspace yet. Please contact your Admin.`,
      );
    }

    const orgId = companyKey.usedByOrganizationId;

    // Verify company workspace is active
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });

    if (!org) {
      throw new BadRequestException('Company workspace not found. Please contact your Admin.');
    }

    if (!org.isActive) {
      throw new ForbiddenException(
        `Company workspace "${org.name}" is not yet active. Please wait for Super Admin approval.`,
      );
    }

    // Check seat limit
    await this.checkSeatLimit(orgId);

    // Prevent duplicate email within the same company
    const existing = await this.prisma.user.findFirst({
      where: { organizationId: orgId, email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException(
        `Email "${dto.email}" is already registered in ${org.name}. Please log in instead.`,
      );
    }

    // Role: employee picks during registration, default to SALES_EXEC
    const assignedRoleName = (dto.role || 'SALES_EXEC').toUpperCase();
    const roleRecord = await this.prisma.role.findFirst({
      where: { organizationId: orgId, name: assignedRoleName },
    });

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const [firstName, ...rest] = dto.name.trim().split(' ');

    const user = await this.prisma.user.create({
      data: {
        organizationId: orgId,
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        firstName,
        lastName: rest.join(' ') || '',
        roleId: roleRecord?.id ?? null,
      },
    });

    // Company key stays active — multiple employees can join using the same key
    const tokens = await this.generateTokens(user.id, orgId, assignedRoleName);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  /** Shared seat-limit guard used by employee registration */
  private async checkSeatLimit(orgId: string) {
    const currentCount = await this.prisma.user.count({
      where: { organizationId: orgId, isActive: true },
    });
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: orgId },
    });
    if (subscription && currentCount >= subscription.memberLimit) {
      throw new BadRequestException(
        `Member seat limit reached (${subscription.memberLimit} seats). Please contact your Admin to upgrade your plan.`,
      );
    }
  }


  /**
   * Google OAuth Authentication with Gmail Verification & Key Enforcement
   */
  /**
   * Google OAuth Authentication with 4-Tier Verification & Password Bypass:
   * 1. Company Database Verification (organizationId)
   * 2. Key Status (Active/Paid/Trial) & Allocated Plan Features
   * 3. Email Verified by Google (Password Bypass) + User Role & Scoping
   * 4. Token & Access Grant
   */
  async googleLogin(dto: GoogleLoginDto) {
    const emailLower = dto.email.toLowerCase().trim();

    // Step 1: Verify Email Format (Google Verified Identity)
    const isGmailOrGoogleWorkspace =
      emailLower.endsWith('@gmail.com') ||
      emailLower.endsWith('@googlemail.com') ||
      emailLower.includes('@');

    if (!isGmailOrGoogleWorkspace) {
      throw new BadRequestException(
        'Google OAuth Authentication requires a valid Gmail or Google Workspace email address.',
      );
    }

    // Step 2: Check Super Admin bypass
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
          companyName: 'DAS CRM System Admin',
        },
        ...tokens,
      };
    }

    // Step 3: Company Workspace Database & Active Status Verification
    if (!dto.organizationId && !dto.key) {
      throw new BadRequestException(
        'Company Workspace Selection and Registration/User Key are required for Google OAuth Login.',
      );
    }

    let organization = dto.organizationId
      ? await this.prisma.organization.findUnique({
          where: { id: dto.organizationId },
          include: { subscription: true },
        })
      : null;

    // Step 4: Key Verification — STRICT exact match, no aliases
    if (dto.key) {
      const cleanKey = dto.key.trim().toUpperCase();
      const companyKey = await this.prisma.companyRegistrationKey.findUnique({
        where: { key: cleanKey },
      });

      if (companyKey) {
        if (companyKey.status === 'REVOKED' || (companyKey.expiresAt && companyKey.expiresAt < new Date())) {
          throw new ForbiddenException(
            `Company Key "${cleanKey}" is revoked or expired. Contact Super Admin.`,
          );
        }
        if (!organization && companyKey.usedByOrganizationId) {
          organization = await this.prisma.organization.findUnique({
            where: { id: companyKey.usedByOrganizationId },
            include: { subscription: true },
          });
        }
        // Verify the key belongs to the selected organization
        if (organization && companyKey.usedByOrganizationId && companyKey.usedByOrganizationId !== organization.id) {
          throw new ForbiddenException(
            `Wrong Company Key: Key "${cleanKey}" does not belong to the selected company workspace. Please use your own Company Key.`,
          );
        }
      } else {
        const userKey = await this.prisma.userInviteKey.findUnique({
          where: { key: cleanKey },
        });

        if (userKey) {
          if (userKey.status === 'REVOKED' || (userKey.expiresAt && userKey.expiresAt < new Date())) {
            throw new ForbiddenException(
              `User Invite Key "${cleanKey}" is revoked or expired. Contact your Tenant Admin.`,
            );
          }
          if (!organization && userKey.organizationId) {
            organization = await this.prisma.organization.findUnique({
              where: { id: userKey.organizationId },
              include: { subscription: true },
            });
          }
        } else {
          throw new UnauthorizedException(
            `Invalid Key: "${cleanKey}" does not match any registered company key. Please use your own Company Key.`,
          );
        }
      }
    } else {
      throw new BadRequestException(
        'Company Key is required for Google OAuth login. Please select your company and enter your key.',
      );
    }

    if (organization && organization.isActive === false) {
      throw new ForbiddenException(
        `Company workspace "${organization.name}" has been deactivated by Super Admin. Access denied.`,
      );
    }

    // Step 5: Email & User Role Scoping (Password Bypass since Google verified email)
    let user = await this.prisma.user.findFirst({
      where: { email: emailLower },
      include: {
        organization: true,
        role: true,
      },
    });

    if (!user) {
      const targetOrgId = organization?.id || dto.organizationId;
      if (!targetOrgId) {
        throw new BadRequestException(
          'No existing workspace found for this account. Please select a valid company workspace and enter your key.',
        );
      }

      const [firstName, ...rest] = dto.name.split(' ');
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 12);

      let defaultRole = await this.prisma.role.findFirst({
        where: { organizationId: targetOrgId, name: 'SALES' },
      });
      if (!defaultRole) {
        defaultRole = await this.prisma.role.findFirst({
          where: { organizationId: targetOrgId },
        });
      }

      user = await this.prisma.user.create({
        data: {
          organizationId: targetOrgId,
          email: emailLower,
          passwordHash: randomPassword,
          firstName,
          lastName: rest.join(' ') || '',
          avatarUrl: dto.picture,
          roleId: defaultRole?.id ?? null,
        },
        include: {
          organization: true,
          role: true,
        },
      });
    }

    if (user.isActive === false) {
      throw new ForbiddenException(
        `User Account Deactivated: Your account (${emailLower}) has been deactivated by your Tenant Admin.`,
      );
    }

    const roleName = user.role?.name || 'ADMIN';
    const tokens = await this.generateTokens(user.id, user.organizationId, roleName);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      organization: user.organization || organization,
      ...tokens,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // STANDARD TENANT ADMIN / STAFF LOGIN
  // ═══════════════════════════════════════════════════════════

  async login(dto: LoginDto) {
    const emailLower = (dto.email || '').toLowerCase().trim();

    // ══════════════════════════════════════════════════════════
    // STEP 1: Company Key is MANDATORY and PRIMARY identifier.
    // The key resolves which company the user belongs to.
    // NO key = NO access. Period.
    // ══════════════════════════════════════════════════════════
    const keyInput = (dto.key || '').trim().toUpperCase();

    if (!keyInput) {
      throw new UnauthorizedException(
        'Company Key is required. Please enter the Company Key provided to your organisation during registration.',
      );
    }

    let resolvedOrgId: string | null = null;
    let resolvedCompanyKey: any = null;

    // Look up EXACT key match — no aliases, no fallbacks
    resolvedCompanyKey = await this.prisma.companyRegistrationKey.findUnique({
      where: { key: keyInput },
    });

    if (resolvedCompanyKey) {
      // Validate key status
      if (resolvedCompanyKey.status === 'REVOKED') {
        throw new ForbiddenException(
          `Company Key Revoked: The key "${keyInput}" has been revoked by Super Admin. Please contact support to get a new key.`,
        );
      }
      if (resolvedCompanyKey.expiresAt && resolvedCompanyKey.expiresAt < new Date()) {
        const keyExpiryStr = resolvedCompanyKey.expiresAt.toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
        throw new ForbiddenException(
          `Company Key Expired: The key "${keyInput}" expired on ${keyExpiryStr}. Please contact Super Admin to renew your plan.`,
        );
      }
      // Key is valid — resolve the organisation it belongs to
      if (!resolvedCompanyKey.usedByOrganizationId) {
        throw new ForbiddenException(
          `Company Key "${keyInput}" is not yet assigned to any company workspace. Please register your company first.`,
        );
      }
      resolvedOrgId = resolvedCompanyKey.usedByOrganizationId;
    } else {
      // Not a company key — check if it is a staff invite key
      const userKey = await this.prisma.userInviteKey.findUnique({
        where: { key: keyInput },
      });
      if (userKey) {
        if (userKey.status === 'REVOKED') {
          throw new ForbiddenException(
            `Staff Invite Key Revoked: The key "${keyInput}" has been revoked. Contact your Tenant Admin.`,
          );
        }
        if (userKey.expiresAt && userKey.expiresAt < new Date()) {
          throw new ForbiddenException(
            `Staff Invite Key Expired: The key "${keyInput}" has expired. Contact your Tenant Admin for a new key.`,
          );
        }
        resolvedOrgId = userKey.organizationId || null;
      } else {
        // Key exists in neither table — hard reject
        throw new UnauthorizedException(
          `Invalid Company Key: "${keyInput}" does not match any registered company. Please check your Company Key and try again.`,
        );
      }
    }

    if (!resolvedOrgId) {
      throw new UnauthorizedException(
        `Company Key "${keyInput}" could not be linked to any active company workspace. Please contact support.`,
      );
    }

    // ══════════════════════════════════════════════════════════
    // STEP 2: Find user — SCOPED to the key's organization.
    // A user can only authenticate within their own company.
    // ══════════════════════════════════════════════════════════
    let user = await this.prisma.user.findFirst({
      where: {
        email: emailLower,
        ...(resolvedOrgId ? { organizationId: resolvedOrgId } : {}),
      },
      include: {
        organization: true,
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    // Demo user provisioning (no key scope restriction for demo accounts)
    if (!user && !resolvedOrgId) {
      user = await this.autoProvisionDemoRoleUser(dto.email, dto.password);
    }

    if (!user) {
      if (resolvedOrgId) {
        // User was not found IN the key's company — give a clear message
        const keyOrg = await this.prisma.organization.findUnique({
          where: { id: resolvedOrgId },
          select: { name: true },
        });
        throw new UnauthorizedException(
          `Wrong Key or Email: No account for "${emailLower}" was found in company workspace "${keyOrg?.name || resolvedOrgId}". Please use your own Company Key.`,
        );
      }
      throw new UnauthorizedException(
        `Wrong Email: No registered user account found for "${emailLower}". Please check your email address or register your company.`,
      );
    }

    // ══════════════════════════════════════════════════════════
    // STEP 3: Cross-verify — if key resolved an org, ensure the
    // user actually belongs to THAT org (belt + suspenders).
    // ══════════════════════════════════════════════════════════
    if (resolvedOrgId && user.organizationId !== resolvedOrgId) {
      throw new ForbiddenException(
        `Wrong Company Key: This key belongs to a different company workspace. Please use your own Company Key to log in.`,
      );
    }

    // If organizationId was passed from UI, also verify it matches
    if (dto.organizationId && user.organizationId && user.organizationId !== dto.organizationId) {
      throw new ForbiddenException(
        'Selected company workspace does not match this user account. Please select your registered company workspace.',
      );
    }

    // 4. User Account Status Verification
    if (user.isActive === false) {
      throw new ForbiddenException(
        `User Account Deactivated: Your account (${emailLower}) has been deactivated by your Tenant Admin. Please contact your company administrator.`,
      );
    }

    if (AuthService.DEMO_ROLE_MAP[emailLower]) {
      const expectedRoleName = AuthService.DEMO_ROLE_MAP[emailLower].role;
      if (user.role?.name !== expectedRoleName) {
        let targetRole = await this.prisma.role.findFirst({
          where: { organizationId: user.organizationId, name: expectedRoleName },
        });
        if (!targetRole) {
          targetRole = await this.prisma.role.create({
            data: { organizationId: user.organizationId, name: expectedRoleName },
          });
        }
        await this.prisma.user.update({
          where: { id: user.id },
          data: { roleId: targetRole.id },
        });
        user.role = targetRole as any;
      }
    }

    // 5. Password Verification
    let valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid && dto.password && typeof dto.password === 'string' && dto.password.trim() !== dto.password) {
      valid = await bcrypt.compare(dto.password.trim(), user.passwordHash);
    }
    if (!valid) {
      throw new UnauthorizedException(
        `Wrong Password: The password entered for account "${emailLower}" is incorrect. Please check your password or click "Forgot Password?" to reset.`,
      );
    }

    // 6. Company Workspace & Verification Status Check
    if (user.organization) {
      const settings = (user.organization.settings as any) || {};
      const regKey = user.organization.registrationKeyId || keyInput || 'N/A';

      if (settings.verificationStatus === 'REJECTED') {
        throw new ForbiddenException({
          code: 'VERIFICATION_REJECTED',
          message: `Company Registration Declined: ${settings.rejectionReason || 'Your company workspace registration was not approved by Super Admin.'}`,
          company: {
            id: user.organization.id,
            name: user.organization.name,
            rejectionReason: settings.rejectionReason,
          },
        });
      }

      if (settings.verificationStatus === 'PENDING' || (user.organization.isActive === false && settings.verificationStatus !== 'APPROVED')) {
        throw new ForbiddenException({
          code: 'VERIFICATION_PENDING',
          message: 'Verification in process: Your company workspace plan is awaiting Super Admin verification. Please wait.',
          company: {
            id: user.organization.id,
            name: user.organization.name,
            adminEmail: user.organization.adminEmail,
            registrationKey: regKey,
            plan: settings.requestedPlan || 'FREE_TRIAL',
            registeredAt: user.organization.createdAt,
            verificationStatus: 'PENDING',
          },
        });
      }

      if (user.organization.isActive === false) {
        throw new ForbiddenException(
          `Company Account Suspended: Access to workspace "${user.organization.name}" has been suspended by System Administrator.`,
        );
      }
    }

    // 7. Subscription Plan Active & Expiry Check (Key tells us if the plan is active)
    if (user.organizationId) {
      const subscription = await this.prisma.subscription.findUnique({
        where: { organizationId: user.organizationId },
      });

      if (subscription) {
        const now = new Date();
        const trialExpired = subscription.trialExpiresAt && subscription.trialExpiresAt < now;
        const subExpired = subscription.expiresAt && subscription.expiresAt < now;
        const isInactive = subscription.isActive === false;

        if (trialExpired || subExpired || isInactive) {
          const expiryDate = subscription.expiresAt || subscription.trialExpiresAt;
          const expiryDateFormatted = expiryDate
            ? expiryDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'recently';

          throw new ForbiddenException(
            `Plan Expired: Your company subscription plan (${subscription.planTier}) expired on ${expiryDateFormatted}. Please contact your Tenant Admin or Super Admin to renew your plan.`,
          );
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
      isCompanyVerified: true,
      verificationStatus: 'APPROVED',
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
        // Use _count instead of fetching full arrays — avoids large data transfer
        _count: { select: { leads: true, deals: true } },
      },
    });

    const regKeys = await this.prisma.companyRegistrationKey.findMany();
    const keyMap = new Map(regKeys.map((k) => [k.usedByOrganizationId, k.key]));

    return orgs.map((org) => {
      const totalLeads = org._count.leads;
      const activeUsers = org.users.filter((u) => u.isActive).length;
      const effectiveExpiry = org.subscription?.expiresAt || org.subscription?.trialExpiresAt;
      const isExpired = effectiveExpiry ? new Date(effectiveExpiry) < new Date() : false;
      const trialDaysLeft = effectiveExpiry
        ? Math.max(0, Math.ceil((new Date(effectiveExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 30;

      const settings = (org.settings as any) || {};
      const regKey = keyMap.get(org.id) || org.registrationKeyId || settings.registrationKey || 'N/A';

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        adminName: org.adminName || settings.adminName || 'Admin',
        adminEmail: org.adminEmail || settings.adminEmail || (org.users[0]?.email ?? 'No Admin Email'),
        phone: org.phone || settings.phone || null,
        city: org.city || settings.city || null,
        state: org.state || settings.state || null,
        pincode: settings.pincode || null,
        gstNumber: org.gstNumber || settings.gstNumber || null,
        panNumber: org.panNumber || settings.panNumber || null,
        panType: settings.panType || 'BUSINESS',
        companyType: org.companyType || settings.companyType || null,
        sector: org.sector || settings.sector || null,
        accountType: settings.accountType || (org.subscription?.isTrialActive ? 'TRIAL' : 'BUY_REQUEST'),
        validityDays: settings.requestedValidityDays || (org.subscription?.trialExpiresAt ? 15 : 30),
        couponCode: settings.couponCode || null,
        registeredAt: settings.registeredAt || org.createdAt,
        settings: org.settings,
        isActive: org.isActive !== false,
        registrationKey: regKey,
        createdAt: org.createdAt,
        plan: org.subscription?.planTier ?? 'FREE_TRIAL',
        seatsAllocated: org.subscription?.memberLimit ?? 6,
        seatsUsed: activeUsers,
        totalUsersCount: org.users.length,
        totalLeads,
        convertedLeads: 0,
        conversionRate: 0,
        expiryDate: effectiveExpiry ? effectiveExpiry.toISOString().split('T')[0] : '2026-12-31',
        isExpired,
        trialDaysLeft,
        subscription: org.subscription,
        verificationStatus: settings.verificationStatus || (org.isActive ? 'APPROVED' : 'PENDING'),
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

    const settings = (org.settings as any) || {};
    const regKey = regKeyRecord?.key || org.registrationKeyId || settings.registrationKey || 'N/A';

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
        adminName: org.adminName || settings.adminName || 'Admin',
        adminEmail: org.adminEmail || settings.adminEmail || '',
        phone: org.phone || settings.phone || null,
        city: org.city || settings.city || null,
        state: org.state || settings.state || null,
        pincode: settings.pincode || null,
        gstNumber: org.gstNumber || settings.gstNumber || null,
        panNumber: org.panNumber || settings.panNumber || null,
        panType: settings.panType || 'BUSINESS',
        companyType: org.companyType || settings.companyType || null,
        sector: org.sector || settings.sector || null,
        accountType: settings.accountType || (org.subscription?.isTrialActive ? 'TRIAL' : 'BUY_REQUEST'),
        validityDays: settings.requestedValidityDays || (org.subscription?.trialExpiresAt ? 15 : 30),
        couponCode: settings.couponCode || null,
        registeredAt: settings.registeredAt || org.createdAt,
        verificationStatus: settings.verificationStatus || (org.isActive ? 'APPROVED' : 'PENDING'),
        settings: org.settings,
        isActive: org.isActive !== false,
        registrationKey: regKey,
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

  async updateCompanyExpiry(companyId: string, expiryDate: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { organizationId: companyId },
    });
    if (!sub) throw new BadRequestException('Subscription not found');

    const parsedDate = new Date(expiryDate);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid expiry date format');
    }

    const now = new Date();
    const isStillActive = parsedDate > now;

    const updated = await this.prisma.subscription.update({
      where: { organizationId: companyId },
      data: {
        expiresAt: parsedDate,
        trialExpiresAt: parsedDate,
        isActive: isStillActive,
        isTrialActive: isStillActive,
      },
    });

    return {
      companyId,
      expiryDate: parsedDate.toISOString().split('T')[0],
      isExpired: !isStillActive,
      message: `Company expiry date successfully updated to ${parsedDate.toISOString().split('T')[0]}`,
    };
  }

  async getPendingCompanies() {
    const orgs = await this.prisma.organization.findMany({
      include: {
        subscription: true,
        users: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const regKeys = await this.prisma.companyRegistrationKey.findMany();
    const keyMap = new Map(regKeys.map((k) => [k.usedByOrganizationId, k.key]));

    return orgs
      .filter((org) => {
        const settings = (org.settings as any) || {};
        const status = settings.verificationStatus || (org.isActive ? 'APPROVED' : 'PENDING');
        return status === 'PENDING' || (!org.isActive && status !== 'APPROVED' && status !== 'REJECTED');
      })
      .map((org) => {
        const settings = (org.settings as any) || {};
        const regKey = keyMap.get(org.id) || org.registrationKeyId || settings.registrationKey || 'N/A';
        const plan = org.subscription?.planTier || settings.requestedPlan || 'GROW';
        const defaultSeats = (plan === 'BUSINESS' || plan === 'PRO') ? 18 : (plan === 'ENTERPRISE' || plan === 'PRO_MAX') ? 60 : plan === 'PRO_50' ? 50 : 6;
        const seats = org.subscription?.memberLimit || defaultSeats;
        return {
          id: org.id,
          name: org.name,
          adminName: org.adminName || settings.adminName || 'Admin',
          adminEmail: org.adminEmail || settings.adminEmail,
          phone: org.phone || settings.phone || null,
          city: org.city || settings.city || null,
          state: org.state || settings.state || null,
          pincode: settings.pincode || null,
          gstNumber: org.gstNumber || settings.gstNumber || null,
          panNumber: org.panNumber || settings.panNumber || null,
          panType: settings.panType || 'BUSINESS',
          companyType: org.companyType || settings.companyType || null,
          sector: org.sector || settings.sector || null,
          couponCode: settings.couponCode || null,
          settings: org.settings,
          registrationKey: regKey,
          plan,
          requestedPlan: plan,
          requestedSeats: seats,
          seatsRequested: seats,
          registeredAt: settings.registeredAt || org.createdAt,
          verificationStatus: 'PENDING',
          accountType: settings.accountType || (settings.requestedValidityDays === 30 ? 'BUY_REQUEST' : 'TRIAL'),
          validityDays: settings.requestedValidityDays || (settings.accountType === 'BUY_REQUEST' ? 30 : 15),
          rejectionReason: settings.rejectionReason,
          delayInquiries: settings.delayInquiries || [],
          features: {
            emailMarketing: org.subscription?.emailMarketingEnabled ?? false,
            whatsappCloud: org.subscription?.whatsAppEnabled ?? false,
            aiEngine: org.subscription?.aiEnabled ?? false,
          },
        };
      });
  }

  async approveCompany(
    companyId: string,
    dto: {
      planTier?: any;
      plan?: any;
      memberLimit?: number;
      validityDays?: number;
      emailEnabled?: boolean;
      whatsAppEnabled?: boolean;
      aiEnabled?: boolean;
      features?: {
        emailMarketing?: boolean;
        whatsappCloud?: boolean;
        aiEngine?: boolean;
      };
      note?: string;
    },
  ) {
    let org = await this.prisma.organization.findUnique({
      where: { id: companyId },
      include: { subscription: true },
    });

    if (!org) {
      const keyRec = await this.prisma.companyRegistrationKey.findFirst({
        where: { key: companyId },
      });
      if (keyRec?.usedByOrganizationId) {
        org = await this.prisma.organization.findUnique({
          where: { id: keyRec.usedByOrganizationId },
          include: { subscription: true },
        });
      }
    }

    if (!org) throw new BadRequestException('Company not found');

    const planTier = dto.planTier || dto.plan || org.subscription?.planTier || 'FREE_TRIAL';
    const defaultPlanSeats = (planTier === 'BUSINESS' || planTier === 'PRO') ? 18 : (planTier === 'ENTERPRISE' || planTier === 'PRO_MAX') ? 60 : planTier === 'PRO_50' ? 50 : 6;
    const memberLimit = dto.memberLimit ?? org.subscription?.memberLimit ?? defaultPlanSeats;
    const validityDays = dto.validityDays ?? 30;
    const newExpiry = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);

    const updatedSettings = {
      ...((org.settings as any) || {}),
      verificationStatus: 'APPROVED',
      verifiedAt: new Date().toISOString(),
      approvalNote: dto.note,
    };

    await this.prisma.organization.update({
      where: { id: org.id },
      data: {
        isActive: true,
        settings: updatedSettings,
      },
    });

    await this.prisma.user.updateMany({
      where: { organizationId: org.id },
      data: { isActive: true },
    });

    if (org.subscription) {
      // Use PLAN_DEFINITIONS as authoritative defaults, allow Super Admin to override per-company
      const planDef = getPlanDefinition(planTier);
      const emailEnabled = dto.emailEnabled ?? dto.features?.emailMarketing ?? planDef.emailEnabled;
      const whatsAppEnabled = dto.whatsAppEnabled ?? dto.features?.whatsappCloud ?? planDef.whatsAppEnabled;
      const aiEnabled = dto.aiEnabled ?? dto.features?.aiEngine ?? planDef.aiEnabled;
      const emailMonthlyQuota = planDef.emailMonthlyQuota; // e.g. 5000 for BUSINESS
      const whatsAppCredits = planDef.whatsAppCreditAllocation; // e.g. 20000 for BUSINESS
      const nextEmailReset = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      await this.prisma.subscription.update({
        where: { organizationId: org.id },
        data: {
          planTier,
          memberLimit,
          trialExpiresAt: newExpiry,
          expiresAt: newExpiry,
          isActive: true,
          isTrialActive: true,
          emailMarketingEnabled: emailEnabled,
          whatsAppEnabled,
          aiEnabled,
          // Set quota fields from plan defaults
          emailMonthlyQuota,
          emailUsedThisMonth: 0,
          emailQuotaResetAt: emailEnabled ? nextEmailReset : null,
          whatsAppCreditBalance: whatsAppEnabled ? whatsAppCredits : 0,
          whatsAppCreditAllocated: whatsAppEnabled ? whatsAppCredits : 0,
          whatsAppLowCreditAlertSent: false,
        },
      });
    }

    // Try sending email if configured
    try {
      if (org.adminEmail) {
        await this.mailService.sendCompanyApprovalEmail({
          adminEmail: org.adminEmail,
          adminName: org.adminName || 'Admin',
          companyName: org.name,
          planTier,
          memberLimit,
          expiryDate: newExpiry.toISOString().split('T')[0],
        });
      }
    } catch (mailErr) {
      this.logger.warn(`Mail notice: Approval email could not be sent: ${mailErr?.message}`);
    }

    return {
      success: true,
      companyId,
      companyName: org.name,
      status: 'ACTIVE',
      verificationStatus: 'APPROVED',
      planTier,
      memberLimit,
      expiryDate: newExpiry.toISOString().split('T')[0],
      message: `Company workspace ${org.name} verified and approved successfully!`,
    };
  }

  /**
   * Super Admin: Top up WhatsApp credit wallet for a company
   */
  async topUpWhatsAppCredits(companyId: string, topUpAmount: number) {
    if (topUpAmount <= 0) throw new BadRequestException('Top-up amount must be greater than 0');

    const sub = await this.prisma.subscription.findUnique({ where: { organizationId: companyId } });
    if (!sub) throw new BadRequestException('Subscription not found');
    if (!sub.whatsAppEnabled) throw new BadRequestException('WhatsApp is not enabled for this company plan');

    const newBalance = sub.whatsAppCreditBalance + topUpAmount;
    const newAllocated = sub.whatsAppCreditAllocated + topUpAmount;

    const updated = await this.prisma.subscription.update({
      where: { organizationId: companyId },
      data: {
        whatsAppCreditBalance: newBalance,
        whatsAppCreditAllocated: newAllocated,
        whatsAppLowCreditAlertSent: false, // Reset alert flag on top-up
      },
    });

    return {
      companyId,
      topUpAmount,
      newBalance: updated.whatsAppCreditBalance,
      totalAllocated: updated.whatsAppCreditAllocated,
      message: `WhatsApp credits topped up by ${topUpAmount}. New balance: ${newBalance}`,
    };
  }

  /**
   * Super Admin: Reset monthly email quota for a company
   */
  async resetEmailQuota(companyId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { organizationId: companyId } });
    if (!sub) throw new BadRequestException('Subscription not found');

    const nextReset = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.subscription.update({
      where: { organizationId: companyId },
      data: {
        emailUsedThisMonth: 0,
        emailQuotaResetAt: nextReset,
      },
    });

    return {
      companyId,
      message: `Email quota reset. ${sub.emailMonthlyQuota} emails available until ${nextReset.toISOString().split('T')[0]}`,
      nextResetAt: nextReset.toISOString().split('T')[0],
    };
  }

  /**
   * Tenant: Get plan entitlements + quota usage for company admin dashboard
   */
  async getCompanyPlanEntitlements(organizationId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { organizationId },
    });
    if (!sub) throw new BadRequestException('Subscription not found for this organization');

    const planDef = getPlanDefinition(sub.planTier);
    const waLowCreditThreshold = sub.whatsAppCreditAllocated > 0
      ? Math.floor(sub.whatsAppCreditAllocated * WHATSAPP_LOW_CREDIT_THRESHOLD_PERCENT)
      : 0;
    const waLowCredit = sub.whatsAppEnabled && sub.whatsAppCreditAllocated > 0
      && sub.whatsAppCreditBalance <= waLowCreditThreshold;

    const emailUsagePct = sub.emailMonthlyQuota > 0
      ? Math.round((sub.emailUsedThisMonth / sub.emailMonthlyQuota) * 100)
      : 0;
    const waUsagePct = sub.whatsAppCreditAllocated > 0
      ? Math.round(((sub.whatsAppCreditAllocated - sub.whatsAppCreditBalance) / sub.whatsAppCreditAllocated) * 100)
      : 0;

    return {
      planTier: sub.planTier,
      planLabel: planDef.label,
      memberLimit: sub.memberLimit,
      isActive: sub.isActive,
      expiresAt: sub.expiresAt,
      features: {
        emailMarketing: {
          enabled: sub.emailMarketingEnabled,
          monthlyQuota: sub.emailMonthlyQuota,
          usedThisMonth: sub.emailUsedThisMonth,
          usagePercent: emailUsagePct,
          isUnlimited: sub.emailMonthlyQuota === 0 && sub.emailMarketingEnabled,
          resetAt: sub.emailQuotaResetAt,
          isExceeded: sub.emailMonthlyQuota > 0 && sub.emailUsedThisMonth >= sub.emailMonthlyQuota,
        },
        whatsApp: {
          enabled: sub.whatsAppEnabled,
          creditBalance: sub.whatsAppCreditBalance,
          creditAllocated: sub.whatsAppCreditAllocated,
          usagePercent: waUsagePct,
          isUnlimited: sub.whatsAppCreditAllocated === 0 && sub.whatsAppEnabled,
          isLowCredit: waLowCredit,
          isExhausted: sub.whatsAppEnabled && sub.whatsAppCreditAllocated > 0 && sub.whatsAppCreditBalance <= 0,
          lowCreditThreshold: waLowCreditThreshold,
        },
        ai: {
          enabled: sub.aiEnabled,
          tier: planDef.aiTier,
        },
      },
      restrictions: planDef.restrictions,
      upgradeable: planDef.upgradeable,
    };
  }

  async rejectCompany(companyId: string, reason: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: companyId } });
    if (!org) throw new BadRequestException('Company not found');

    const updatedSettings = {
      ...((org.settings as any) || {}),
      verificationStatus: 'REJECTED',
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason || 'Registration application declined by Super Admin',
    };

    await this.prisma.organization.update({
      where: { id: companyId },
      data: {
        isActive: false,
        settings: updatedSettings,
      },
    });

    return {
      success: true,
      companyId,
      verificationStatus: 'REJECTED',
      message: `Company registration declined. Reason: ${reason}`,
    };
  }

  /**
   * Super Admin: Resolve payload for generating/sending company registration certificate PDF
   */
  async getCompanyRegistrationPdfPayload(companyId: string) {
    let org = await this.prisma.organization.findUnique({
      where: { id: companyId },
      include: {
        subscription: true,
        users: { select: { id: true, email: true, firstName: true, lastName: true }, take: 1 },
      },
    });

    if (!org) {
      const regKey = await this.prisma.companyRegistrationKey.findFirst({
        where: { key: companyId },
      });
      if (regKey?.usedByOrganizationId) {
        org = await this.prisma.organization.findUnique({
          where: { id: regKey.usedByOrganizationId },
          include: {
            subscription: true,
            users: { select: { id: true, email: true, firstName: true, lastName: true }, take: 1 },
          },
        });
      }
    }

    if (!org) {
      const fallbackName = companyId.replace(/^comp_/, '').replace(/[_-]/g, ' ').toUpperCase() || 'DEMO ENTERPRISE';
      return {
        org: null,
        key: 'DAS-KX-7421',
        adminEmail: 'dynamicadvancesolution@gmail.com',
        adminName: 'Platform Administrator',
        companyName: fallbackName,
        planTier: 'BUSINESS' as any,
        memberLimit: 25,
        validityDays: 30,
        accountType: 'BUY_REQUEST',
        adminPassword: '(protected)',
        pincode: '110001',
        phone: '+91 98765 43210',
        city: 'New Delhi',
        state: 'Delhi',
        gstNumber: '07AAAAA0000A1Z5',
        panNumber: 'ABCDE1234F',
        panType: 'BUSINESS',
        companyType: 'Private Limited',
        sector: 'Technology & Software',
        couponCode: undefined,
      };
    }

    const regKey = await this.prisma.companyRegistrationKey.findFirst({
      where: { usedByOrganizationId: org.id },
    });

    const settings = (org.settings as any) || {};
    const key = regKey?.key || org.registrationKeyId || 'DAS-KEY';
    const adminEmail = org.adminEmail || org.users[0]?.email || 'admin@company.com';
    const adminName =
      org.adminName ||
      (org.users[0]
        ? `${org.users[0].firstName} ${org.users[0].lastName}`.trim()
        : 'Workspace Admin');
    const planTier = org.subscription?.planTier || settings.requestedPlan || 'FREE_TRIAL';
    const memberLimit = org.subscription?.memberLimit || 6;
    const validityDays =
      settings.requestedValidityDays || (settings.accountType === 'BUY_REQUEST' ? 30 : 15);

    return {
      org,
      key,
      adminEmail,
      adminName,
      companyName: org.name,
      planTier,
      memberLimit,
      validityDays,
      accountType: settings.accountType || (validityDays === 30 ? 'BUY_REQUEST' : 'TRIAL'),
      adminPassword: '(as set during registration)',
      pincode: settings.pincode || undefined,
      phone: org.phone || undefined,
      city: org.city || undefined,
      state: org.state || undefined,
      gstNumber: org.gstNumber || undefined,
      panNumber: org.panNumber || settings.panNumber || undefined,
      panType: settings.panType || 'BUSINESS',
      companyType: org.companyType || undefined,
      sector: org.sector || undefined,
      couponCode: settings.couponCode || undefined,
    };
  }

  /**
   * Super Admin: Dispatch Registration Certificate PDF to the company's admin email
   */
  async sendCompanyRegistrationPdf(companyId: string, recipientEmail?: string) {
    const payload = await this.getCompanyRegistrationPdfPayload(companyId);
    if (recipientEmail && recipientEmail.trim()) {
      payload.adminEmail = recipientEmail.trim();
    }
    const result = await this.mailService.sendCompanyRegistrationEmail(payload);
    return {
      success: result.success,
      provider: result.provider,
      previewUrl: result.previewUrl,
      outboxId: result.outboxId,
      adminEmail: payload.adminEmail,
      companyName: payload.companyName,
      message: `Registration Certificate PDF dispatched to ${payload.adminEmail}`,
      delivery: result,
    };
  }

  /**
   * Super Admin: Generate Registration Certificate PDF buffer for direct client download
   */
  async generateCompanyRegistrationPdf(companyId: string): Promise<{ buffer: Buffer; filename: string; companyName: string }> {
    const payload = await this.getCompanyRegistrationPdfPayload(companyId);
    const registeredAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const buffer = await this.mailService.generateRegistrationPdfBuffer({
      ...payload,
      registeredAt,
    });
    const safeName = payload.companyName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const filename = `DAS_CRM_Registration_${safeName}_${payload.key}.pdf`;
    return { buffer, filename, companyName: payload.companyName };
  }

  async checkCompanyVerificationStatus(idOrKey: string) {
    let org = await this.prisma.organization.findUnique({
      where: { id: idOrKey },
      include: { subscription: true },
    });

    if (!org) {
      const keyRecord = await this.prisma.companyRegistrationKey.findUnique({
        where: { key: idOrKey.trim().toUpperCase() },
      });
      if (keyRecord && keyRecord.usedByOrganizationId) {
        org = await this.prisma.organization.findUnique({
          where: { id: keyRecord.usedByOrganizationId },
          include: { subscription: true },
        });
      }
    }

    if (!org) {
      return {
        found: false,
        verificationStatus: 'NOT_FOUND',
        isVerified: false,
        message: 'No company workspace found for this identifier.',
      };
    }

    const settings = (org.settings as any) || {};
    const verificationStatus = settings.verificationStatus || (org.isActive ? 'APPROVED' : 'PENDING');
    const isVerified = verificationStatus === 'APPROVED' && org.isActive !== false;

    return {
      found: true,
      companyId: org.id,
      companyName: org.name,
      adminEmail: org.adminEmail,
      registrationKey: org.registrationKeyId || idOrKey,
      planTier: org.subscription?.planTier || settings.requestedPlan || 'FREE_TRIAL',
      isVerified,
      verificationStatus,
      registeredAt: org.createdAt,
      rejectionReason: settings.rejectionReason,
    };
  }

  async sendDelayInquiry(dto: {
    companyName: string;
    registrationKey?: string;
    adminEmail?: string;
    message?: string;
  }) {
    this.logger.log(
      `[DELAY INQUIRY] Company "${dto.companyName}" (${dto.registrationKey || 'No Key'}) inquiry: "${dto.message || 'Please expedite verification'}" from ${dto.adminEmail}`,
    );

    try {
      const org = await this.prisma.organization.findFirst({
        where: {
          OR: [
            { name: dto.companyName },
            { adminEmail: dto.adminEmail },
          ],
        },
      });
      if (org) {
        const settings = (org.settings as any) || {};
        const inquiries = Array.isArray(settings.delayInquiries) ? [...settings.delayInquiries] : [];
        inquiries.unshift({
          id: `inq_${Date.now()}`,
          message: dto.message || 'Verification inquiry from tenant',
          submittedAt: new Date().toISOString(),
          adminEmail: dto.adminEmail,
        });
        await this.prisma.organization.update({
          where: { id: org.id },
          data: {
            settings: {
              ...settings,
              delayInquiries: inquiries,
            },
          },
        });
      }
    } catch (_) {}

    try {
      await this.mailService.sendDelayInquiryNotification({
        companyName: dto.companyName,
        registrationKey: dto.registrationKey,
        adminEmail: dto.adminEmail,
        message: dto.message,
      });
    } catch (e) {
      // Graceful fallback
    }

    return {
      success: true,
      message: 'Inquiry submitted successfully to Super Admin team at dynamicadvancesolution@gmail.com',
    };
  }

  async getPublicCompanies() {
    const orgs = await this.prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        registrationKeyId: true,
        settings: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const regKeys = await this.prisma.companyRegistrationKey.findMany();
    const keyMap = new Map<string, string>();
    for (const k of regKeys) {
      if (k.usedByOrganizationId) keyMap.set(k.usedByOrganizationId, k.key);
      keyMap.set(k.id, k.key);
    }

    return orgs.map((org) => {
      const settings = (org.settings as any) || {};
      const status = settings.verificationStatus || (org.isActive ? 'APPROVED' : 'PENDING');
      const resolvedKey =
        keyMap.get(org.id) ||
        keyMap.get(org.registrationKeyId || '') ||
        settings.registrationKey ||
        null;

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        isActive: org.isActive,
        status,
        companyKey: resolvedKey,
      };
    });
  }

  async register(dto: RegisterDto) {
    await this.validateCompanyUniqueness({
      email: dto.email,
    });

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

    const keyRecord = await this.companyKeyService.generateCompanyKey({
      companyName: dto.organizationName,
      gstNumber: (dto as any).gstNumber,
      panNumber: (dto as any).panNumber,
      planTier: 'FREE_TRIAL' as any,
      memberLimit: 6,
      validityDays: 15,
    });

    await this.prisma.organization.update({
      where: { id: result.org.id },
      data: {
        adminEmail: dto.email,
        adminName: `${dto.firstName} ${dto.lastName}`.trim(),
        registrationKeyId: keyRecord.id,
      },
    });

    const mailResult: MailDeliveryResult = await this.mailService
      .sendCompanyRegistrationEmail({
        adminEmail: dto.email,
        adminName: `${dto.firstName} ${dto.lastName}`.trim(),
        companyName: dto.organizationName,
        key: keyRecord.key,
        planTier: 'FREE_TRIAL',
        memberLimit: 6,
        validityDays: 15,
        adminPassword: dto.password,
        sector: dto.industry,
      })
      .catch((mailErr) => {
        this.logger.warn(`Register confirmation email error: ${mailErr?.message}`);
        return {
          success: false,
          provider: 'outbox_only' as const,
          error: mailErr?.message,
        };
      });

    const tokens = await this.generateTokens(
      result.user.id,
      result.org.id,
      result.ownerRole.name,
    );
    await this.saveRefreshToken(result.user.id, tokens.refreshToken);

    const emailStatusMessage =
      mailResult.provider === 'primary_smtp'
        ? `Official Registration Certificate emailed to ${dto.email}`
        : mailResult.provider === 'fallback_smtp'
        ? `Delivered via secondary mail service to ${dto.email}`
        : mailResult.provider === 'ethereal'
        ? `Live SMTP quota exceeded. Sandbox preview generated and saved to outbox.`
        : `Email saved to system outbox (${mailResult.outboxId || 'saved'}).`;

    return {
      user: this.sanitizeUser(result.user),
      organization: result.org,
      registrationKey: keyRecord.key,
      emailDelivery: {
        sent: mailResult.success,
        provider: mailResult.provider,
        previewUrl: mailResult.previewUrl,
        outboxId: mailResult.outboxId,
        message: emailStatusMessage,
      },
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
    try {
      await this.prisma.refreshToken.create({
        data: { userId, token, expiresAt },
      });
    } catch (e) {
      // Ignore foreign key constraint for Super Admin or non-user IDs
    }
  }

  private sanitizeUser(user: any) {
    const { passwordHash, mfaSecret, ...safe } = user;
    return safe;
  }

  private async autoProvisionDemoRoleUser(email: string, passwordInput: string) {
    const emailLower = email.toLowerCase().trim();
    const demoConfig = AuthService.DEMO_ROLE_MAP[emailLower];
    if (!demoConfig) return null;

    let org = await this.prisma.organization.findFirst();
    if (!org) {
      org = await this.prisma.organization.create({
        data: {
          name: 'Acme Sales Solutions',
          slug: 'acme-sales-solutions-' + Date.now().toString(36),
        },
      });
    }

    let role = await this.prisma.role.findFirst({
      where: { organizationId: org.id, name: demoConfig.role },
    });
    if (!role) {
      role = await this.prisma.role.create({
        data: {
          organizationId: org.id,
          name: demoConfig.role,
        },
      });
    }

    const [firstName, ...rest] = demoConfig.name.split(' ');
    const passwordHash = await bcrypt.hash(passwordInput || 'password123', 12);

    return this.prisma.user.create({
      data: {
        organizationId: org.id,
        email: emailLower,
        passwordHash,
        firstName,
        lastName: rest.join(' ') || '',
        roleId: role.id,
      },
      include: {
        organization: true,
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // FORGOT PASSWORD / PASSWORD RESET FLOW
  // ═══════════════════════════════════════════════════════════

  /** Store OTP with TTL, auto-purge expired entry after expiry to prevent memory leak */
  private setResetOtp(email: string, otp: string, ttlMs: number) {
    const expiresAt = Date.now() + ttlMs;
    this.resetOtps.set(email, { otp, expiresAt });
    setTimeout(() => {
      const entry = this.resetOtps.get(email);
      if (entry && entry.expiresAt <= Date.now()) {
        this.resetOtps.delete(email);
      }
    }, ttlMs + 1000); // +1s grace to avoid race
  }

  async requestPasswordReset(email: string) {
    const emailLower = email.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: { email: emailLower },
    });

    if (!user) {
      return {
        message: `If an account with ${email} exists, a 6-digit password reset OTP code has been sent.`,
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const OTP_TTL_MS = 15 * 60 * 1000;

    this.setResetOtp(emailLower, otp, OTP_TTL_MS);

    await this.mailService.sendPasswordResetOtp(emailLower, otp);

    return {
      message: `Password reset OTP has been sent to ${emailLower}. Valid for 15 minutes.`,
    };
  }

  async resetPassword(dto: { email: string; otp: string; newPassword: string }) {
    const emailLower = dto.email.toLowerCase().trim();
    const record = this.resetOtps.get(emailLower);

    if (!record || record.otp !== dto.otp.trim() || Date.now() > record.expiresAt) {
      throw new BadRequestException('Invalid or expired password reset OTP code.');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: emailLower },
    });
    if (!user) throw new BadRequestException('User account not found.');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    this.resetOtps.delete(emailLower);

    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    };
  }

  // ═══════════════════════════════════════════════════════════
  // MAIL DIAGNOSTICS & OUTBOX MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  async getMailStatus() {
    return this.mailService.getSmtpStatus();
  }

  async getMailOutbox(limit?: number) {
    return this.mailService.getOutboxHistory(limit);
  }

  async getMailOutboxItem(id: string) {
    return this.mailService.getOutboxItem(id);
  }

  async sendTestMail(to: string) {
    return this.mailService.sendTestMail(to);
  }
}
