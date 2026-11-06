import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ActivitiesService } from './activities.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log a new contact activity (Call, WhatsApp, Email, Meeting, Note)' })
  logActivity(
    @CurrentUser() user: any,
    @Body()
    dto: {
      activityType: any;
      leadId?: string;
      contactId?: string;
      dealId?: string;
      subject?: string;
      notes: string;
      durationMin?: number;
      durationSeconds?: number;
      outcome?: string;
      nextAction?: string;
      nextActionDate?: Date;
      metadata?: Record<string, any>;
      userId?: string;
      createdAt?: Date | string;
      timestamp?: Date | string;
    },
  ) {
    const targetUserId = dto.userId || user?.id;
    const orgId = user?.organizationId || 'cmuev7n3o000mikew7je1tdiw';
    return this.activitiesService.log(orgId, targetUserId, dto);
  }

  @Get('today-summary')
  @ApiOperation({ summary: "Get today's sales, operations, and telemetry summary for dashboard" })
  getTodaySummary(@CurrentUser() user: any) {
    return this.activitiesService.getTodaySummary(user.organizationId);
  }

  @Get('lead/:leadId')
  @ApiOperation({ summary: 'Get all contact activities and timeline for a lead' })
  async getLeadTimeline(
    @CurrentUser() user: any,
    @Param('leadId') leadId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const res = await this.activitiesService.getTimeline(user.organizationId, {
      leadId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return {
      success: true,
      total: res.total,
      page: res.page,
      limit: res.limit,
      items: res.items,
      activities: res.items,
      data: res.items,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all contact activities and timeline across the workspace' })
  getAllActivities(
    @CurrentUser() user: any,
    @Query('leadId') leadId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.activitiesService.getTimeline(user.organizationId, {
      leadId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 1000,
    });
  }
}
