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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
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
  @ApiOperation({ summary: 'Register a new organization + admin account' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email + password (Tenant Admin & Staff)',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with Google OAuth & Gmail verification' })
  googleLogin(@Body() dto: GoogleLoginDto) {
    return this.authService.googleLogin(dto);
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
    },
  ) {
    return this.authService.registerCompanyWithKey(body);
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

  // ── Staff User Key ─────────────────────────────────────────

  @Post('staff-register')
  @ApiOperation({ summary: 'Staff member registers using a User Invite Key' })
  staffLoginWithKey(
    @Body()
    body: {
      userKey: string;
      name: string;
      email: string;
      password: string;
      phone?: string;
    },
  ) {
    return this.authService.staffLoginWithKey(body);
  }

  @Post('validate-user-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a User Invite Key (preview role)' })
  async validateUserKey(@Body('key') key: string) {
    const record = await this.companyKeyService.validateUserKey(key);
    if (!record) return { valid: false };
    return {
      valid: true,
      assignedRole: record.assignedRole,
      expiresAt: record.expiresAt,
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
      superAdminId: req.user.sub,
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
      organizationId: req.user.org_id,
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
}
