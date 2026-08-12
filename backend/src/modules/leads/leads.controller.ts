import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List all leads with filters, pagination & search' })
  findAll(@CurrentUser() user: any, @Query() query: LeadQueryDto) {
    return this.leadsService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead detail with full timeline' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.leadsService.findOne(user.organizationId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  create(@CurrentUser() user: any, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(user.organizationId, user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update lead' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(user.organizationId, user.id, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change lead status (with history tracking)' })
  changeStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('statusId') statusId: string,
    @Body('notes') notes?: string,
  ) {
    return this.leadsService.changeStatus(
      user.organizationId,
      user.id,
      id,
      statusId,
      notes,
    );
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get lead activity timeline' })
  timeline(@CurrentUser() user: any, @Param('id') id: string) {
    return this.leadsService.getTimeline(user.organizationId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete lead' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.leadsService.remove(user.organizationId, id);
  }

  // ── Lead Distribution Engine (3 Allocation Models + Manager Control) ──

  @Get('distribution/whitelist')
  @ApiOperation({ summary: 'Get Whitelisted Managers eligible for Acquire Pool' })
  getAcquirePoolWhitelist(@CurrentUser() user: any) {
    return this.leadsService.getAcquirePoolWhitelist(user.organizationId);
  }

  @Get('distribution/admin-master-view')
  @ApiOperation({ summary: 'Admin Master Audit View — All pool leads with Allocated User, Status, Last Updated & Activity' })
  getAdminPoolMasterView(@CurrentUser() user: any) {
    return this.leadsService.getAdminPoolMasterView(user.organizationId);
  }

  @Get('distribution/open-pool')
  @ApiOperation({ summary: '[Model 2] Get unassigned leads with anonymized serial # (Admin Access Guarded)' })
  getOpenGrabPool(@CurrentUser() user: any) {
    return this.leadsService.getOpenGrabPool(user.organizationId, user.id);
  }

  @Post('distribution/grab-lead/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Model 2] Dynamic Grab Flow — Rep claims lead from open pool' })
  grabLeadFromPool(@CurrentUser() user: any, @Param('id') id: string) {
    return this.leadsService.grabLeadFromPool(
      user.organizationId,
      user.id,
      id,
    );
  }

  @Post('distribution/batch-quota')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Model 1] Custom Batch Quota Allocation' })
  customBatchQuotaAllocation(
    @CurrentUser() user: any,
    @Body() dto: { allocations: { managerId: string; limit: number }[] },
  ) {
    return this.leadsService.customBatchQuotaAllocation(
      user.organizationId,
      dto,
    );
  }

  @Post('distribution/direct-funnel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Model 3] Direct Admin Funnel Targeting to Manager' })
  directAdminFunnel(
    @CurrentUser() user: any,
    @Body() dto: { leadIds: string[]; targetManagerId: string },
  ) {
    return this.leadsService.directAdminFunnel(user.organizationId, dto);
  }

  @Post('distribution/manager-allocate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manager Downstream Allocation Control (TL / Staff)' })
  managerDownstreamAllocate(
    @CurrentUser() user: any,
    @Body() dto: { leadIds: string[]; targetUserId: string },
  ) {
    return this.leadsService.managerDownstreamAllocate(
      user.organizationId,
      user.id,
      dto,
    );
  }
}
