import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TeamsService } from './teams.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get('hierarchy')
  @ApiOperation({ summary: 'Get organization reporting hierarchy (Hybrid Model A & B)' })
  async getHierarchy(@CurrentUser() user: any) {
    return this.teamsService.getHierarchy(user.organizationId);
  }

  @Post('assign-hierarchy')
  @ApiOperation({ summary: 'Assign or move employee under a Manager or TL (Admin only)' })
  async assignHierarchy(@CurrentUser() user: any, @Body() body: any) {
    const roleName = typeof user.role === 'string' ? user.role : user.role?.name || '';
    return this.teamsService.assignEmployeeHierarchy(user.organizationId, roleName, body);
  }

  @Post('team-leader')
  @ApiOperation({ summary: 'Create new Team / Team Leader (Admin only)' })
  async createTeamLeader(@CurrentUser() user: any, @Body() body: any) {
    const roleName = typeof user.role === 'string' ? user.role : user.role?.name || '';
    return this.teamsService.createTeamLeader(user.organizationId, roleName, body);
  }
}
