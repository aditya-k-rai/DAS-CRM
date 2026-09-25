import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
  Req,
  Ip,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CompanyKeyService } from './company-key.service';
import { PlanTier, UserRole } from '@prisma/client';

import { GoogleLoginDto } from './dto/google-login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private companyKeyService: CompanyKeyService,
  ) {}

  // ── Standard Login / Register ──────────────────────────────

  @Post('register')
  @Throttle({ auth_otp: { limit: 15, ttl: 3600000 } })
  @ApiOperation({ summary: 'Register a new organization + admin account' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ auth_otp: { limit: 15, ttl: 3600000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email + password (Tenant Admin & Staff)',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  @Throttle({ auth_otp: { limit: 15, ttl: 3600000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with Google OAuth & Gmail verification' })
  googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
  }

  @Post('forgot-password')
  @Throttle({ auth_otp: { limit: 15, ttl: 3600000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request 6-digit password reset OTP email' })
  forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code and reset password' })
  resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
    return this.authService.resetPassword(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refreshToken(token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout (revoke refresh token)' })
  logout(@CurrentUser() user: any, @Body('refreshToken') token: string) {
    return this.authService.logout(user.id, token);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: any) {
    const { passwordHash, mfaSecret, ...safe } = user;
    return safe;
  }

  // ── Super Admin Auth ───────────────────────────────────────

  @Post('super-admin/request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[Super Admin] Step 1: Send OTP to super admin email',
  })
  superAdminRequestOtp(@Body('email') email: string, @Ip() ip: string) {
    return this.authService.superAdminRequestOtp(email, ip);
  }

  @Post('super-admin/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Super Admin] Step 2: Verify OTP and get JWT' })
  superAdminVerifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.superAdminVerifyOtp(body.email, body.otp);
  }

  // ── Company Registration Key ───────────────────────────────

  @Post('company-register')
  @ApiOperation({
    summary:
      'Register a new company workspace using a Company Registration Key',
  })
  registerCompanyWithKey(
    @Body()
    body: {
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
    },
  ) {
    return this.authService.registerCompanyWithKey(body);
  }

  @Post('check-company-exists')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Check if Email, Phone, GSTIN, or Business PAN is already registered',
  })
  async checkCompanyExists(
    @Body()
    body: {
      email?: string;
      phone?: string;
      gstNumber?: string;
      panNumber?: string;
    },
  ) {
    if (!body.email && !body.phone && !body.gstNumber && !body.panNumber) {
      return { isUnique: true };
    }
    return this.authService.validateCompanyUniqueness({
      email: body.email || '',
      phone: body.phone,
      gstNumber: body.gstNumber,
      panNumber: body.panNumber,
    });
  }

  @Post('validate-company-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate a Company Registration Key (preview plan info)',
  })
  async validateCompanyKey(@Body('key') key: string) {
    const record = await this.companyKeyService.validateCompanyKey(key);
    if (!record) return { valid: false };
    return {
      valid: true,
      planTier: record.planTier,
      memberLimit: record.memberLimit,
      validityDays: record.validityDays,
      whatsAppEnabled: record.whatsAppEnabled,
      emailMarketingEnabled: record.emailMarketingEnabled,
      expiresAt: record.expiresAt,
      qrCodeDataUrl: record.qrCodeDataUrl,
    };
  }

  // ── Mail Diagnostics & Outbox ───────────────────────────────

  @Get('mail-status')
  @ApiOperation({ summary: 'Check SMTP delivery status, outbox counts, and health' })
  getMailStatus() {
    return this.authService.getMailStatus();
  }

  @Post('test-mail')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a diagnostic test email to verify delivery pipeline' })
  sendTestMail(@Body('to') to?: string) {
    const targetEmail = to || 'adtyamighty@gmail.com';
    return this.authService.sendTestMail(targetEmail);
  }

  @Get('mail-outbox')
  @ApiOperation({ summary: 'List recent local outbox manifests' })
  getMailOutbox() {
    return this.authService.getMailOutbox(50);
  }

  // ── Staff User Key (Company Key) ───────────────────────────

  @Post('staff-register')
  @ApiOperation({ summary: 'Employee registers using their Company Key' })
  staffLoginWithKey(
    @Body()
    body: {
      userKey: string;
      name: string;
      email: string;
      password: string;
      phone?: string;
      role?: string;
    },
  ) {
    return this.authService.staffLoginWithKey(body);
  }

  @Post('validate-user-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a Company Key for employee self-registration' })
  async validateUserKey(@Body('key') key: string) {
    const cleanKey = (key || '').trim().toUpperCase();
    if (!cleanKey) {
      return { valid: false, message: 'Please enter your Company Key.' };
    }

    // Each company has exactly ONE key — the rule-based Company Registration Key
    const companyKey = await this.companyKeyService.validateCompanyKey(cleanKey);

    if (!companyKey) {
      return {
        valid: false,
        message: `Key "${cleanKey}" is not a valid Company Key. Please check the key your Admin provided and try again.`,
      };
    }

    if (!companyKey.usedByOrganizationId) {
      return {
        valid: false,
        message: `Key "${cleanKey}" has not been linked to a company workspace yet. Please complete company registration first.`,
      };
    }

    const org = await this.companyKeyService.getOrganizationById(companyKey.usedByOrganizationId);

    if (!org) {
      return {
        valid: false,
        message: 'Company workspace not found. Please contact your Admin.',
      };
    }

    if (!org.isActive) {
      return {
        valid: false,
        message: `Company workspace "${org.name}" is not yet active. Please wait for Super Admin approval before registering.`,
      };
    }

    return {
      valid: true,
      keyType: 'COMPANY_KEY',
      organizationId: companyKey.usedByOrganizationId,
      organizationName: org.name,
      expiresAt: companyKey.expiresAt,
    };
  }

  // ── Generate Keys (Admin Only) ─────────────────────────────

  @Post('generate-company-key')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[Super Admin] Generate a Company Registration Key',
  })
  generateCompanyKey(
    @Body()
    body: {
      companyName: string;
      gstNumber?: string;
      panNumber?: string;
      planTier: PlanTier;
      memberLimit: number;
      validityDays: number;
      whatsAppEnabled?: boolean;
      emailMarketingEnabled?: boolean;
    },
    @Req() req: any,
  ) {
    return this.companyKeyService.generateCompanyKey({
      ...body,
      superAdminId: req.user?.sub || req.user?.id,
    });
  }

  @Post('generate-user-key')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Tenant Admin] Generate a User Invite Key' })
  generateUserKey(
    @Body()
    body: {
      organizationName: string;
      assignedRole: UserRole;
      validityDays?: number;
    },
    @Req() req: any,
  ) {
    return this.companyKeyService.generateUserKey({
      organizationId: req.user?.org_id || req.user?.organizationId,
      organizationName: body.organizationName,
      assignedRole: body.assignedRole,
      validityDays: body.validityDays,
    });
  }

  // ── Public Active Companies List ────────────────────────────

  @Get('public-companies')
  @ApiOperation({ summary: 'Get list of active companies for login selection' })
  getPublicCompanies() {
    return this.authService.getPublicCompanies();
  }

  // ── Super Admin Company & User Management ───────────────────

  @Get('super-admin/companies')
  @ApiOperation({ summary: '[Super Admin] Get all client companies with stats' })
  getAllCompanies() {
    return this.authService.getAllCompanies();
  }

  @Get('super-admin/companies/pending')
  @ApiOperation({ summary: '[Super Admin] Get all companies awaiting verification & approval' })
  getPendingCompanies() {
    return this.authService.getPendingCompanies();
  }

  @Get('super-admin/companies/:id')
  @ApiOperation({ summary: '[Super Admin] Get full in-depth company details' })
  getCompanyDetails(@Param('id') id: string) {
    return this.authService.getCompanyDetails(id);
  }

  @Patch('super-admin/companies/:id/block')
  @ApiOperation({ summary: '[Super Admin] Toggle block/unblock for a company' })
  toggleCompanyBlock(@Param('id') id: string) {
    return this.authService.toggleCompanyBlock(id);
  }

  @Patch('super-admin/companies/:id/seats')
  @ApiOperation({ summary: '[Super Admin] Update seat limit for a company' })
  updateCompanySeats(
    @Param('id') id: string,
    @Body('memberLimit') memberLimit: number,
  ) {
    return this.authService.updateCompanySeats(id, memberLimit);
  }

  @Patch('super-admin/companies/:id/expiry')
  @ApiOperation({ summary: '[Super Admin] Update custom subscription expiry date for a company' })
  updateCompanyExpiry(
    @Param('id') id: string,
    @Body('expiryDate') expiryDate: string,
  ) {
    return this.authService.updateCompanyExpiry(id, expiryDate);
  }

  @Patch('super-admin/companies/:id/approve')
  @ApiOperation({ summary: '[Super Admin] Approve & activate company with verified plan' })
  approveCompany(
    @Param('id') id: string,
    @Body()
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
    return this.authService.approveCompany(id, dto);
  }

  @Patch('super-admin/companies/:id/reject')
  @ApiOperation({ summary: '[Super Admin] Reject company registration' })
  rejectCompany(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.authService.rejectCompany(id, reason);
  }

  @Post('super-admin/companies/:id/send-registration-pdf')
  @ApiOperation({ summary: '[Super Admin] Send registration certificate PDF to company admin or custom email' })
  sendCompanyRegistrationPdf(
    @Param('id') id: string,
    @Body('recipientEmail') recipientEmail?: string,
  ) {
    return this.authService.sendCompanyRegistrationPdf(id, recipientEmail);
  }

  @Get('super-admin/companies/:id/registration-pdf')
  @ApiOperation({ summary: '[Super Admin] Download company registration certificate PDF' })
  async downloadCompanyRegistrationPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.authService.generateCompanyRegistrationPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('company-verification-status/:idOrKey')
  @ApiOperation({ summary: 'Check current company verification status' })
  checkCompanyVerificationStatus(@Param('idOrKey') idOrKey: string) {
    return this.authService.checkCompanyVerificationStatus(idOrKey);
  }

  @Post('inquire-verification-delay')
  @ApiOperation({ summary: 'Submit delay inquiry to Super Admin' })
  inquireVerificationDelay(
    @Body()
    dto: {
      companyName: string;
      registrationKey?: string;
      adminEmail?: string;
      message?: string;
    },
  ) {
    return this.authService.sendDelayInquiry(dto);
  }

  @Patch('super-admin/users/:userId/block')
  @ApiOperation({ summary: '[Super Admin] Toggle block/unblock for a user' })
  toggleUserBlock(@Param('userId') userId: string) {
    return this.authService.toggleUserBlock(userId);
  }

  // ── Super Admin Key Management ──────────────────────────────

  @Get('super-admin/keys')
  @ApiOperation({ summary: '[Super Admin] Get all company & staff keys' })
  async getAllKeys() {
    const companyKeys = await this.companyKeyService.getAllCompanyKeys();
    const userKeys = await this.companyKeyService.getAllUserKeys();
    return { companyKeys, userKeys };
  }

  @Patch('super-admin/keys/company/:keyId/revoke')
  @ApiOperation({ summary: '[Super Admin] Revoke/block a company key' })
  revokeCompanyKey(@Param('keyId') keyId: string) {
    return this.companyKeyService.revokeCompanyKey(keyId);
  }

  @Patch('super-admin/keys/user/:keyId/revoke')
  @ApiOperation({ summary: '[Super Admin] Revoke/block a staff key' })
  revokeUserKey(@Param('keyId') keyId: string) {
    return this.companyKeyService.revokeUserKey(keyId);
  }

  // ── Public Plan Definitions (for Registration page plan comparison) ──

  @Get('plan-definitions')
  @ApiOperation({ summary: 'Get all plan definitions with features and quotas (public)' })
  getPlanDefinitions() {
    // Import from plan-config and return as-is — no auth required
    const { PLAN_DEFINITIONS, REGISTERABLE_PLANS } = require('../../common/plan-config');
    return {
      plans: REGISTERABLE_PLANS.map((key: string) => PLAN_DEFINITIONS[key]),
      registerablePlans: REGISTERABLE_PLANS,
    };
  }

  // ── Tenant Plan Entitlements & Quota Usage ──────────────────

  @Get('company-plan-entitlements')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '[Tenant Admin/Manager] Get plan feature entitlements + quota usage' })
  getCompanyPlanEntitlements(@Req() req: any) {
    return this.authService.getCompanyPlanEntitlements(req.user.org_id);
  }

  // ── Super Admin Quota Management ────────────────────────────

  @Patch('super-admin/companies/:id/top-up-whatsapp')
  @ApiOperation({ summary: '[Super Admin] Add WhatsApp credits to company wallet' })
  topUpWhatsAppCredits(
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    return this.authService.topUpWhatsAppCredits(id, amount);
  }

  @Post('super-admin/companies/:id/reset-email-quota')
  @ApiOperation({ summary: '[Super Admin] Reset monthly email quota for a company' })
  resetEmailQuota(@Param('id') id: string) {
    return this.authService.resetEmailQuota(id);
  }
}
