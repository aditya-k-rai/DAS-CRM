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
}
