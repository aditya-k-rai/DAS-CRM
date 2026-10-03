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
    },
  ) {
    return this.activitiesService.log(user.organizationId, user.id, dto);
  }

  @Get('lead/:leadId')
  @ApiOperation({ summary: 'Get all contact activities and timeline for a lead' })
  getLeadTimeline(
    @CurrentUser() user: any,
    @Param('leadId') leadId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.activitiesService.getTimeline(user.organizationId, {
      leadId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }
}

