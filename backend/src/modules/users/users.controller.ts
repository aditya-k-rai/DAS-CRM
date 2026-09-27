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
  Injectable,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Gracefully return user or null without throwing 401
    return user || null;
  }
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(OptionalJwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all organization users/members (including unassigned)' })
  async findAll(
    @CurrentUser() user: any,
    @Headers('x-organization-id') headerOrgId?: string,
    @Query('organizationId') queryOrgId?: string,
    @Query('companyKey') companyKey?: string,
  ) {
    let orgId = user?.organizationId || queryOrgId || headerOrgId;
    if (!orgId && companyKey) {
      orgId = await this.usersService.resolveOrgIdByKey(companyKey);
    }
    if (!orgId) {
      orgId = 'cmuev7n3o000mikew7je1tdiw';
    }
    return this.usersService.findAll(orgId);
  }

  @Get('company-key')
  @ApiOperation({ summary: 'Get company registration key for inviting unassigned users' })
  async getCompanyKey(
    @CurrentUser() user: any,
    @Headers('x-organization-id') headerOrgId?: string,
    @Query('organizationId') queryOrgId?: string,
    @Query('companyKey') companyKey?: string,
  ) {
    let orgId = user?.organizationId || queryOrgId || headerOrgId;
    if (!orgId && companyKey) {
      orgId = await this.usersService.resolveOrgIdByKey(companyKey);
    }
    if (!orgId) {
      orgId = 'cmuev7n3o000mikew7je1tdiw';
    }
    return this.usersService.getCompanyKey(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Admin directly adds an employee or unassigned user to the company workspace' })
  async createUser(
    @CurrentUser() adminUser: any,
    @Headers('x-organization-id') headerOrgId: string,
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
    const orgId =
      adminUser?.organizationId ||
      body.organizationId ||
      headerOrgId ||
      'cmuev7n3o000mikew7je1tdiw';
    const adminId = adminUser?.id || 'admin_direct';
    return this.usersService.createUser(orgId, adminId, body);
  }

  @Patch(':id/verify-role')
  @ApiOperation({ summary: 'Admin approves & verifies an unassigned user and sets their initial role' })
  async verifyAndAssignRole(
    @CurrentUser() adminUser: any,
    @Headers('x-organization-id') headerOrgId: string,
    @Param('id') targetUserId: string,
    @Body() body: { role?: string; assignedRole?: string; organizationId?: string },
  ) {
    const orgId =
      adminUser?.organizationId ||
      body.organizationId ||
      headerOrgId ||
      'cmuev7n3o000mikew7je1tdiw';
    const adminId = adminUser?.id || 'admin_direct';
    const role = body?.assignedRole || body?.role || 'SALES_EXEC';
    return this.usersService.verifyAndAssignRole(
      orgId,
      adminId,
      targetUserId,
      role,
    );
  }

  @Patch(':id/change-role')
  @ApiOperation({ summary: 'Admin upgrades or downgrades permanent employee role with Company Key confirmation' })
  async changeUserRole(
    @CurrentUser() adminUser: any,
    @Headers('x-organization-id') headerOrgId: string,
    @Param('id') targetUserId: string,
    @Body() body: { targetRole: string; companyKey: string; organizationId?: string },
  ) {
    const orgId =
      adminUser?.organizationId ||
      body?.organizationId ||
      headerOrgId ||
      'cmuev7n3o000mikew7je1tdiw';
    const adminId = adminUser?.id || 'admin_direct';
    return this.usersService.changeUserRole(
      orgId,
      adminId,
      targetUserId,
      body.targetRole,
      body.companyKey,
    );
  }

  @Patch(':id/upgrade-role')
  @ApiOperation({ summary: 'Admin upgrades employee role with Company Key confirmation' })
  async upgradeUserRole(
    @CurrentUser() adminUser: any,
    @Headers('x-organization-id') headerOrgId: string,
    @Param('id') targetUserId: string,
    @Body() body: { organizationId?: string; targetRole?: string; companyKey?: string },
  ) {
    const orgId =
      adminUser?.organizationId ||
      body?.organizationId ||
      headerOrgId ||
      'cmuev7n3o000mikew7je1tdiw';
    const adminId = adminUser?.id || 'admin_direct';
    if (body?.targetRole && body?.companyKey) {
      return this.usersService.changeUserRole(
        orgId,
        adminId,
        targetUserId,
        body.targetRole,
        body.companyKey,
      );
    }
    return this.usersService.upgradeUserRole(
      orgId,
      adminId,
      targetUserId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin removes/rejects an unassigned user or employee from the workspace' })
  async removeUser(
    @CurrentUser() adminUser: any,
    @Headers('x-organization-id') headerOrgId: string,
    @Param('id') targetUserId: string,
    @Query('organizationId') queryOrgId?: string,
  ) {
    const orgId =
      adminUser?.organizationId ||
      queryOrgId ||
      headerOrgId ||
      'cmuev7n3o000mikew7je1tdiw';
    const adminId = adminUser?.id || 'admin_direct';
    return this.usersService.removeUser(
      orgId,
      adminId,
      targetUserId,
    );
  }

  @Patch('phone')
  @ApiOperation({ summary: 'Update organization/user contact phone' })
  async updatePhone(
    @CurrentUser() user: any,
    @Headers('x-organization-id') headerOrgId: string,
    @Body() body: { phone: string; organizationId?: string },
  ) {
    const orgId =
      user?.organizationId ||
      body.organizationId ||
      headerOrgId ||
      'cmuev7n3o000mikew7je1tdiw';
    const userId = user?.id || 'admin_direct';
    return this.usersService.updatePhone(orgId, userId, body.phone);
  }
}
