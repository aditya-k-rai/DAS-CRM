import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CouponDiscountType } from '@prisma/client';

export interface CreateCouponDto {
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxUses?: number;
  applicablePlans?: string[];
  expiresAt?: string;
}

export interface ValidateCouponResult {
  valid: boolean;
  couponId?: string;
  code?: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  discountLabel?: string;
  error?: string;
}

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  /**
   * Super Admin: Create a new coupon
   */
  async createCoupon(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase().trim() },
    });
    if (existing) {
      throw new ConflictException(`Coupon code "${dto.code}" already exists`);
    }

    if (dto.discountType === 'PERCENT_OFF' && (dto.discountValue <= 0 || dto.discountValue > 100)) {
      throw new BadRequestException('PERCENT_OFF discount must be between 1 and 100');
    }
    if (dto.discountType === 'FLAT_OFF' && dto.discountValue <= 0) {
      throw new BadRequestException('FLAT_OFF discount amount must be greater than 0');
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase().trim(),
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxUses: dto.maxUses ?? null,
        applicablePlans: dto.applicablePlans ?? [],
        isActive: true,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return { coupon, message: `Coupon "${coupon.code}" created successfully` };
  }

  /**
   * Super Admin: List all coupons with redemption stats
   */
  async listCoupons() {
    const coupons = await this.prisma.coupon.findMany({
      include: {
        redemptions: {
          select: {
            id: true,
            organizationId: true,
            redeemedAt: true,
            discountApplied: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    return coupons.map((c) => ({
      ...c,
      redemptionCount: c.redemptions.length,
      isExpired: c.expiresAt ? c.expiresAt < now : false,
      isExhausted: c.maxUses !== null ? c.usedCount >= c.maxUses : false,
    }));
  }

  /**
   * Super Admin: Revoke / deactivate a coupon
   */
  async revokeCoupon(couponId: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    await this.prisma.coupon.update({
      where: { id: couponId },
      data: { isActive: false },
    });

    return { message: `Coupon "${coupon.code}" has been revoked` };
  }

  /**
   * Public: Validate a coupon code for a given org + plan
   * Does NOT redeem — just validates.
   */
  async validateCoupon(
    code: string,
    organizationId: string,
    planKey?: string,
  ): Promise<ValidateCouponResult> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: {
        redemptions: { where: { organizationId } },
      },
    });

    if (!coupon) {
      return { valid: false, error: 'Coupon code not found' };
    }
    if (!coupon.isActive) {
      return { valid: false, error: 'This coupon has been deactivated' };
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { valid: false, error: `Coupon expired on ${coupon.expiresAt.toLocaleDateString('en-IN')}` };
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, error: 'Coupon has reached its maximum number of uses' };
    }
    if (coupon.redemptions.length > 0) {
      return { valid: false, error: 'Your company has already used this coupon' };
    }
    if (planKey && coupon.applicablePlans.length > 0) {
      const isApplicable = coupon.applicablePlans.includes(planKey.toUpperCase());
      if (!isApplicable) {
        return {
          valid: false,
          error: `Coupon is only valid for plans: ${coupon.applicablePlans.join(', ')}`,
        };
      }
    }

    const discountLabel =
      coupon.discountType === 'PERCENT_OFF'
        ? `${coupon.discountValue}% off`
        : `₹${coupon.discountValue} flat off`;

    return {
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountLabel,
    };
  }

  /**
   * Internal: Record a coupon redemption (called during plan activation)
   */
  async redeemCoupon(
    couponId: string,
    organizationId: string,
    subscriptionId: string,
    discountApplied: number,
  ) {
    await this.prisma.$transaction([
      this.prisma.couponRedemption.create({
        data: {
          couponId,
          organizationId,
          subscriptionId,
          discountApplied,
        },
      }),
      this.prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      }),
    ]);
  }
}
