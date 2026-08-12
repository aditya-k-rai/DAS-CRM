import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';
import { PlanTier } from '@prisma/client';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('plan')
  @ApiOperation({ summary: 'Get current plan details for logged-in org' })
  async getCurrentPlan(@Req() req: any) {
    return this.billingService.getCurrentPlan(req.user.org_id);
  }

  @Post('create-order')
  @ApiOperation({
    summary: 'Create a Razorpay order for plan upgrade (Web only)',
  })
  async createOrder(
    @Body() body: { requestedPlan: PlanTier; addOnSeats?: number },
    @Req() req: any,
  ) {
    return this.billingService.createRazorpayOrder({
      organizationId: req.user.org_id,
      requestedPlan: body.requestedPlan,
      addOnSeats: body.addOnSeats,
    });
  }

  @Post('verify-payment')
  @ApiOperation({
    summary: 'Verify Razorpay payment and submit upgrade request',
  })
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
      organizationId: req.user.org_id,
      ...body,
    });
  }

  // ── Super Admin Endpoints ────────────────────────────────────

  @Get('upgrade-requests')
  @ApiOperation({ summary: '[Super Admin] Get all pending upgrade requests' })
  async getUpgradeRequests() {
    return this.billingService.getPendingUpgradeRequests();
  }

  @Post('upgrade-requests/:requestId/approve')
  @ApiOperation({ summary: '[Super Admin] Approve a plan upgrade request' })
  async approveRequest(@Param('requestId') requestId: string, @Req() req: any) {
    return this.billingService.approvePlanUpgrade(requestId, req.user.sub);
  }

  @Post('upgrade-requests/:requestId/reject')
  @ApiOperation({ summary: '[Super Admin] Reject a plan upgrade request' })
  async rejectRequest(
    @Param('requestId') requestId: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.billingService.rejectPlanUpgrade(
      requestId,
      req.user.sub,
      body.reason,
    );
  }
}
