import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LeavesService } from './leaves.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Leaves')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('leaves')
export class LeavesController {
  constructor(private leavesService: LeavesService) {}

  @Get()
  @ApiOperation({ summary: 'Get leave requests (Managers see own team, HR/Admin see company, Employee sees self)' })
  async getLeaveRequests(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('userId') targetUserId?: string,
  ) {
    return this.leavesService.getLeaveRequests(user.organizationId, user, {
      status,
      userId: targetUserId,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Apply for a new leave request' })
  async applyLeave(@CurrentUser() user: any, @Body() body: any) {
    return this.leavesService.applyLeave(user.organizationId, user.id, body);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve leave request (Manager for team, HR/Admin company-wide)' })
  async approveLeave(@CurrentUser() user: any, @Param('id') id: string) {
    return this.leavesService.approveLeave(user.organizationId, user, id);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject leave request (Manager for team, HR/Admin company-wide)' })
  async rejectLeave(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('rejectionNote') rejectionNote?: string,
  ) {
    return this.leavesService.rejectLeave(user.organizationId, user, id, rejectionNote);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel own pending leave request' })
  async cancelLeave(@CurrentUser() user: any, @Param('id') id: string) {
    return this.leavesService.cancelLeave(user.organizationId, user.id, id);
  }

  @Get('balances')
  @ApiOperation({ summary: 'Get leave balances and policies' })
  async getLeaveBalances(
    @CurrentUser() user: any,
    @Query('year') year?: string,
    @Query('userId') targetUserId?: string,
  ) {
    const queryUserId = targetUserId || user.id;
    return this.leavesService.getLeaveBalances(
      user.organizationId,
      queryUserId,
      year ? parseInt(year, 10) : undefined,
    );
  }
}
