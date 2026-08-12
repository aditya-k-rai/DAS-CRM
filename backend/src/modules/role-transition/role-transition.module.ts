import { Module } from '@nestjs/common';
import { RoleTransitionService } from './role-transition.service';
import { RoleTransitionController } from './role-transition.controller';
import { RoleTransitionGuard } from './role-transition.guard';
import { ActivityExportService } from './activity-export.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RoleTransitionController],
  providers: [
    RoleTransitionService,
    ActivityExportService,
    RoleTransitionGuard,
  ],
  exports: [RoleTransitionService, RoleTransitionGuard],
})
export class RoleTransitionModule {}
