import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';
import { CouponService } from './coupon.service';
import { PlanTier, CouponDiscountType } from '@prisma/client';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(
    private billingService: BillingService,
    private couponService: CouponService,
  ) {}

  private getOrgId(req: any): string {
    const orgId = req.user?.organizationId || req.user?.org_id;
    if (!orgId) {
      throw new BadRequestException('Organization context not found in session.');
    }
    return orgId;
  }

  private getUserId(req: any): string {
    return req.user?.id || req.user?.sub || '';
  }

  private assertSuperAdmin(req: any) {
    const roleName = typeof req.user?.role === 'string' ? req.user.role : req.user?.role?.name;
    if (roleName !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Super Administrators can perform platform billing control operations.');
    }
  }

  @Get('plan')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current plan details for logged-in org' })
  async getCurrentPlan(@Req() req: any) {
    return this.billingService.getCurrentPlan(this.getOrgId(req));
  }

  @Post('create-order')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a Razorpay order for plan upgrade (Web only)' })
  async createOrder(
    @Body() body: { requestedPlan: PlanTier; addOnSeats?: number },
    @Req() req: any,
  ) {
    return this.billingService.createRazorpayOrder({
      organizationId: this.getOrgId(req),
      requestedPlan: body.requestedPlan,
      addOnSeats: body.addOnSeats,
    });
  }

  @Post('verify-payment')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Verify Razorpay payment and submit upgrade request' })
  async verifyPayment(
    @Body()
    body: {
      requestedPlan: PlanTier;
      addOnSeats?: number;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
    @Req() req: any,
  ) {
    return this.billingService.verifyPaymentAndCreateRequest({
      organizationId: this.getOrgId(req),
      ...body,
    });
  }

  // ── Super Admin Upgrade Request Management ─────────────────

  @Get('upgrade-requests')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '[Super Admin] Get all pending upgrade requests' })
  async getUpgradeRequests(@Req() req: any) {
    this.assertSuperAdmin(req);
    return this.billingService.getPendingUpgradeRequests();
  }

  @Post('upgrade-requests/:requestId/approve')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '[Super Admin] Approve a plan upgrade request' })
  async approveRequest(@Param('requestId') requestId: string, @Req() req: any) {
    this.assertSuperAdmin(req);
    return this.billingService.approvePlanUpgrade(requestId, this.getUserId(req));
  }

  @Post('upgrade-requests/:requestId/reject')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '[Super Admin] Reject a plan upgrade request' })
  async rejectRequest(
    @Param('requestId') requestId: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    this.assertSuperAdmin(req);
    return this.billingService.rejectPlanUpgrade(requestId, this.getUserId(req), body.reason);
  }

  // ── Coupon Management (Super Admin) ───────────────────────────

  @Post('coupons')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '[Super Admin] Create a discount coupon' })
  async createCoupon(
    @Body()
    body: {
      code: string;
      description?: string;
      discountType: CouponDiscountType;
      discountValue: number;
      maxUses?: number;
      applicablePlans?: string[];
      expiresAt?: string;
    },
    @Req() req: any,
  ) {
    this.assertSuperAdmin(req);
    return this.couponService.createCoupon(body);
  }

  @Get('coupons')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '[Super Admin] List all coupons with redemption stats' })
  async listCoupons(@Req() req: any) {
    this.assertSuperAdmin(req);
    return this.couponService.listCoupons();
  }

  @Delete('coupons/:couponId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '[Super Admin] Revoke/deactivate a coupon' })
  async revokeCoupon(@Param('couponId') couponId: string, @Req() req: any) {
    this.assertSuperAdmin(req);
    return this.couponService.revokeCoupon(couponId);
  }

  // ── Coupon Validation (Public / Tenant / Registration page) ───

  @Post('validate-coupon')
  @ApiOperation({ summary: 'Validate a coupon code for the current org + plan (public, no auth required)' })
  async validateCoupon(
    @Body() body: { code: string; planKey?: string },
    @Req() req: any,
  ) {
    const orgId = req?.user?.organizationId || req?.user?.org_id || 'pre-registration';
    return this.couponService.validateCoupon(body.code, orgId, body.planKey);
  }
}
