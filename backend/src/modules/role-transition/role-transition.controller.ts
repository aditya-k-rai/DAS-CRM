import { Controller, Post, Body, Param, UseGuards, Req, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoleTransitionService } from './role-transition.service';
import { RoleTransitionGuard, SKIP_LOCK_CHECK } from './role-transition.guard';
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@ApiTags('Role Transition')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/role-transition')
export class RoleTransitionController {
  constructor(private roleTransitionService: RoleTransitionService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Admin initiates a role change (creates 24hr lock)' })
  async initiate(
    @Body() body: { userId: string; newRole: UserRole },
    @Req() req: any,
  ) {
    return this.roleTransitionService.initiateRoleTransition({
      userId: body.userId,
      newRole: body.newRole,
      initiatedByAdminId: req.user.sub,
      organizationId: req.user.org_id,
    });
  }

  @Post('accept')
  @SetMetadata(SKIP_LOCK_CHECK, true)
  @ApiOperation({ summary: 'Logged-in user accepts their new role (releases lock)' })
  async accept(@Req() req: any) {
    return this.roleTransitionService.acceptRoleTransition(req.user.sub);
  }

  @Post('revert/:transitionId')
  @SetMetadata(SKIP_LOCK_CHECK, true)
  @ApiOperation({ summary: 'Admin reverts a pending role transition' })
  async revert(@Param('transitionId') transitionId: string, @Req() req: any) {
    return this.roleTransitionService.revertRoleTransition(transitionId, req.user.sub);
  }

  @Get('active-lock')
  @ApiOperation({ summary: 'Get current user active role transition lock' })
  async getActiveLock(@Req() req: any) {
    const transition = await this.roleTransitionService.getActiveTransition(req.user.sub);
    return { isLocked: !!transition, transition: transition ?? null };
  }
}
