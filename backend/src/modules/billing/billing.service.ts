import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../auth/mail.service';
import { PlanTier } from '@prisma/client';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

// Plan configuration: memberLimit (user quota, admin NOT counted), price in paise
const PLAN_CONFIG: Record<string, { memberLimit: number; pricePaise: number }> = {
  STARTER: { memberLimit: 6, pricePaise: 199900 },    // ₹1,999/mo
  PRO: { memberLimit: 20, pricePaise: 499900 },        // ₹4,999/mo
  PRO_50: { memberLimit: 50, pricePaise: 999900 },     // ₹9,999/mo
  PRO_MAX: { memberLimit: 0, pricePaise: 1999900 },    // ₹19,999/mo (unlimited)
  ENTERPRISE: { memberLimit: 0, pricePaise: 0 },       // Custom negotiated
};

@Injectable()
export class BillingService {
  private razorpay: Razorpay;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
  }

  /**
   * Get current plan details for an organization (shown on billing page)
   */
  async getCurrentPlan(organizationId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId },
      include: { upgradeRequests: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    const currentUserCount = await this.prisma.user.count({
      where: { organizationId, isActive: true },
    });

    return {
      ...subscription,
      currentUserCount,
      plans: PLAN_CONFIG,
    };
  }

  /**
   * Step 1: Create a Razorpay order for a plan upgrade
   */
  async createRazorpayOrder(dto: {
    organizationId: string;
    requestedPlan: PlanTier;
    addOnSeats?: number;
  }) {
    const planConfig = PLAN_CONFIG[dto.requestedPlan];
    if (!planConfig) throw new BadRequestException('Invalid plan selected');
    if (dto.requestedPlan === 'ENTERPRISE') {
      throw new BadRequestException(
        'Enterprise plans require manual negotiation. Please contact support.',
      );
    }

    const amountPaise = planConfig.pricePaise;
    if (amountPaise === 0) throw new BadRequestException('Contact support for Enterprise pricing');

    const order = await this.razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      notes: {
        organizationId: dto.organizationId,
        requestedPlan: dto.requestedPlan,
      },
    });

    return {
      orderId: order.id,
      amountPaise,
      amountInr: amountPaise / 100,
      currency: 'INR',
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  /**
   * Step 2: Verify Razorpay payment and create upgrade request for Super Admin review
   */
  async verifyPaymentAndCreateRequest(dto: {
    organizationId: string;
    requestedPlan: PlanTier;
    addOnSeats?: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    // Verify Razorpay signature (HMAC-SHA256)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Payment verification failed: invalid signature');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { organizationId: dto.organizationId },
      include: { organization: true },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    const planConfig = PLAN_CONFIG[dto.requestedPlan];

    // Create upgrade request — status: PENDING_SUPER_ADMIN_APPROVAL
    const upgradeRequest = await this.prisma.planUpgradeRequest.create({
      data: {
        subscriptionId: subscription.id,
        organizationId: dto.organizationId,
        requestedPlan: dto.requestedPlan,
        requestedMemberLimit: planConfig.memberLimit,
        addOnSeats: dto.addOnSeats ?? 0,
        razorpayOrderId: dto.razorpayOrderId,
        razorpayPaymentId: dto.razorpayPaymentId,
        razorpaySignature: dto.razorpaySignature,
        paymentVerified: true,
        amountPaise: planConfig.pricePaise,
        status: 'PENDING_SUPER_ADMIN_APPROVAL',
      },
    });

    // Notify Super Admin
    try {
      await this.mailService.sendPlanUpgradeRequestNotification(
        process.env.SUPER_ADMIN_EMAIL || 'adtyamighty@gmail.com',
        subscription.organization.name,
        dto.requestedPlan,
        planConfig.pricePaise / 100,
      );
    } catch (err) {
      console.error('[Billing] Failed to notify Super Admin:', err);
    }

    return {
      upgradeRequest,
      message: 'Payment verified. Your upgrade request is pending Super Admin approval.',
    };
  }

  /**
   * Super Admin approves an upgrade request — zero data loss, just unlocks features
   */
  async approvePlanUpgrade(requestId: string, superAdminId: string) {
    const request = await this.prisma.planUpgradeRequest.findUnique({
      where: { id: requestId },
      include: { subscription: { include: { organization: true } } },
    });
    if (!request) throw new NotFoundException('Upgrade request not found');
    if (request.status !== 'PENDING_SUPER_ADMIN_APPROVAL') {
      throw new BadRequestException('This request is not pending approval');
    }

    const planConfig = PLAN_CONFIG[request.requestedPlan];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.$transaction([
      // Update subscription — zero data loss
      this.prisma.subscription.update({
        where: { id: request.subscriptionId },
        data: {
          planTier: request.requestedPlan,
          memberLimit: request.requestedMemberLimit + (request.addOnSeats ?? 0),
          isTrialActive: false,
          startsAt: now,
          expiresAt,
          // Unlock paid features
          whatsAppEnabled: true,
          emailMarketingEnabled: true,
          aiEnabled: false, // AI unlocked only for PRO_MAX
        },
      }),
      // Mark request as APPROVED
      this.prisma.planUpgradeRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedBySuperAdminId: superAdminId,
          reviewedAt: now,
        },
      }),
    ]);

    return {
      message: `Plan upgraded to ${request.requestedPlan} successfully`,
      organization: request.subscription.organization.name,
    };
  }

  /**
   * Super Admin rejects an upgrade request
   */
  async rejectPlanUpgrade(requestId: string, superAdminId: string, reason: string) {
    const request = await this.prisma.planUpgradeRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Upgrade request not found');
    if (request.status !== 'PENDING_SUPER_ADMIN_APPROVAL') {
      throw new BadRequestException('This request is not pending approval');
    }

    await this.prisma.planUpgradeRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedBySuperAdminId: superAdminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    return { message: 'Upgrade request rejected' };
  }

  /**
   * Get all pending upgrade requests (for Super Admin dashboard)
   */
  async getPendingUpgradeRequests() {
    return this.prisma.planUpgradeRequest.findMany({
      where: { status: 'PENDING_SUPER_ADMIN_APPROVAL' },
      include: { subscription: { include: { organization: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
