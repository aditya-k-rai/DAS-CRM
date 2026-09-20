import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { CouponService } from './coupon.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BillingController],
  providers: [BillingService, CouponService],
  exports: [BillingService, CouponService],
})
export class BillingModule {}
