import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  private getAuthorizedOrgId(user: any, requestedOrgId?: string): string {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
    const isSuperAdmin = roleName === 'SUPER_ADMIN';

    // Super Admin can act on any organization specified in query/body
    if (isSuperAdmin && requestedOrgId) {
      return requestedOrgId;
    }

    const orgId = user.organizationId || user.org_id;
    if (!orgId) {
      throw new BadRequestException('Organization context not found for user');
    }
    return orgId;
  }

  @Get()
  @ApiOperation({ summary: 'List all organization users/members (including unassigned)' })
  async findAll(
    @CurrentUser() user: any,
    @Query('organizationId') queryOrgId?: string,
  ) {
    const orgId = this.getAuthorizedOrgId(user, queryOrgId);
    return this.usersService.findAll(orgId, user?.id);
  }

  @Get('company-key')
  @ApiOperation({ summary: 'Get company registration key for inviting unassigned users' })
  async getCompanyKey(
    @CurrentUser() user: any,
    @Query('organizationId') queryOrgId?: string,
  ) {
    const orgId = this.getAuthorizedOrgId(user, queryOrgId);
    return this.usersService.getCompanyKey(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Admin directly adds an employee or unassigned user to the company workspace' })
  async createUser(
    @CurrentUser() adminUser: any,
    @Body()
    body: {
      name: string;
      email: string;
      password?: string;
      phone?: string;
      role?: string;
      organizationId?: string;
    },
  ) {
    const orgId = this.getAuthorizedOrgId(adminUser, body.organizationId);
    return this.usersService.createUser(orgId, adminUser.id, body);
  }

  @Patch(':id/verify-role')
  @ApiOperation({ summary: 'Admin approves & verifies an unassigned user and sets their initial role' })
  async verifyAndAssignRole(
    @CurrentUser() adminUser: any,
    @Param('id') targetUserId: string,
    @Body() body: { role?: string; assignedRole?: string; organizationId?: string },
  ) {
    const orgId = this.getAuthorizedOrgId(adminUser, body.organizationId);
    const role = body?.assignedRole || body?.role || 'SALES_EXEC';
    return this.usersService.verifyAndAssignRole(
      orgId,
      adminUser.id,
      targetUserId,
      role,
    );
  }

  @Patch(':id/change-role')
  @ApiOperation({ summary: 'Admin upgrades or downgrades permanent employee role with Company Key confirmation' })
  async changeUserRole(
    @CurrentUser() adminUser: any,
    @Param('id') targetUserId: string,
    @Body() body: { targetRole: string; companyKey: string; organizationId?: string },
  ) {
    const orgId = this.getAuthorizedOrgId(adminUser, body?.organizationId);
    return this.usersService.changeUserRole(
      orgId,
      adminUser.id,
      targetUserId,
      body.targetRole,
      body.companyKey,
    );
  }

  @Patch(':id/upgrade-role')
  @ApiOperation({ summary: 'Admin upgrades employee role with Company Key confirmation' })
  async upgradeUserRole(
    @CurrentUser() adminUser: any,
    @Param('id') targetUserId: string,
    @Body() body: { organizationId?: string; targetRole?: string; companyKey?: string },
  ) {
    const orgId = this.getAuthorizedOrgId(adminUser, body?.organizationId);
    if (body?.targetRole && body?.companyKey) {
      return this.usersService.changeUserRole(
        orgId,
        adminUser.id,
        targetUserId,
        body.targetRole,
        body.companyKey,
      );
    }
    return this.usersService.upgradeUserRole(
      orgId,
      adminUser.id,
      targetUserId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin removes/rejects an unassigned user or employee from the workspace' })
  async removeUser(
    @CurrentUser() adminUser: any,
    @Param('id') targetUserId: string,
    @Query('organizationId') queryOrgId?: string,
  ) {
    const orgId = this.getAuthorizedOrgId(adminUser, queryOrgId);
    return this.usersService.removeUser(
      orgId,
      adminUser.id,
      targetUserId,
    );
  }

  @Patch('phone')
  @ApiOperation({ summary: 'Update organization/user contact phone' })
  async updatePhone(
    @CurrentUser() user: any,
    @Body() body: { phone: string; organizationId?: string },
  ) {
    const orgId = this.getAuthorizedOrgId(user, body.organizationId);
    return this.usersService.updatePhone(orgId, user.id, body.phone);
  }

  @Patch(':id/manager')
  @ApiOperation({ summary: 'Change the assigned supervisor/manager for a user' })
  async assignManager(
    @CurrentUser() adminUser: any,
    @Param('id') targetUserId: string,
    @Body() body: { managerId: string; organizationId?: string },
  ) {
    const orgId = this.getAuthorizedOrgId(adminUser, body?.organizationId);
    return this.usersService.assignManager(orgId, adminUser.id, targetUserId, body.managerId);
  }
}
