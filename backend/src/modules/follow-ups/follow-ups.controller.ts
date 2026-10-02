import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FollowUpsService } from './follow-ups.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Follow-ups')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('follow-ups')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Get()
  @ApiOperation({ summary: 'List follow-ups with filters, search, sort, pagination' })
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.followUpsService.findAll(user.organizationId, user.id, query, user.role);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get follow-up summary counts for dashboard cards' })
  getSummary(@CurrentUser() user: any) {
    return this.followUpsService.getSummary(user.organizationId, user.id, user.role);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today follow-ups segmented into Due Now, Upcoming, Completed, Missed' })
  getToday(@CurrentUser() user: any) {
    return this.followUpsService.getToday(user.organizationId, user.id, user.role);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get follow-ups for a date range (calendar view)' })
  getCalendar(@CurrentUser() user: any, @Query() query: { dateFrom: string; dateTo: string }) {
    return this.followUpsService.getCalendar(user.organizationId, user.id, query, user.role);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search follow-ups across authorized records' })
  search(@CurrentUser() user: any, @Query('q') q: string) {
    return this.followUpsService.search(user.organizationId, user.id, q, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single follow-up with full details and timeline' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.followUpsService.findOne(user.organizationId, user.id, id, user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new follow-up' })
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.followUpsService.create(user.organizationId, user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a follow-up' })
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.followUpsService.update(user.organizationId, user.id, id, dto);
  }

  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a follow-up with outcome and optional next follow-up' })
  complete(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.followUpsService.complete(user.organizationId, user.id, id, dto);
  }

  @Patch(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule a follow-up to a new date/time' })
  reschedule(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.followUpsService.reschedule(user.organizationId, user.id, id, dto);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a follow-up' })
  cancel(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.followUpsService.cancel(user.organizationId, user.id, id, dto);
  }

  @Post(':id/note')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a note to a follow-up' })
  addNote(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: { note: string }) {
    return this.followUpsService.addNote(user.organizationId, user.id, id, dto);
  }
}
