import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
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

  @Get()
  @ApiOperation({ summary: 'List all organization users/members (including unassigned)' })
  async findAll(@CurrentUser() user: any) {
    return this.usersService.findAll(user.organizationId);
  }

  @Patch(':id/verify-role')
  @ApiOperation({ summary: 'Admin approves & verifies an unassigned user and sets their initial role' })
  async verifyAndAssignRole(
    @CurrentUser() adminUser: any,
    @Param('id') targetUserId: string,
    @Body() body: { role?: string; assignedRole?: string },
  ) {
    const role = body?.assignedRole || body?.role || 'SALES_EXEC';
    return this.usersService.verifyAndAssignRole(
      adminUser.organizationId,
      adminUser.id,
      targetUserId,
      role,
    );
  }

  @Patch(':id/upgrade-role')
  @ApiOperation({ summary: 'Admin upgrades employee role strictly along Sales -> TL -> Manager' })
  async upgradeUserRole(
    @CurrentUser() adminUser: any,
    @Param('id') targetUserId: string,
  ) {
    return this.usersService.upgradeUserRole(
      adminUser.organizationId,
      adminUser.id,
      targetUserId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin removes/rejects an unassigned user or employee from the workspace' })
  async removeUser(
    @CurrentUser() adminUser: any,
    @Param('id') targetUserId: string,
  ) {
    return this.usersService.removeUser(
      adminUser.organizationId,
      adminUser.id,
      targetUserId,
    );
  }

  @Patch('phone')
  @ApiOperation({ summary: 'Update organization/user contact phone' })
  async updatePhone(@CurrentUser() user: any, @Body() body: { phone: string }) {
    return this.usersService.updatePhone(user.organizationId, user.id, body.phone);
  }
}
