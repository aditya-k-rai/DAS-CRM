import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DealsService } from './deals.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Deals')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('deals')
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @Get('pipelines')
  @ApiOperation({ summary: 'Get all deal pipelines and stages for current organization' })
  async getPipelines(@CurrentUser() user: any) {
    return this.dealsService.getPipelines(user.organizationId);
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Get sales forecast metrics for current organization' })
  async getForecast(@CurrentUser() user: any) {
    return this.dealsService.getForecast(user.organizationId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all deals for current organization with optional filters' })
  async getDeals(
    @CurrentUser() user: any,
    @Query('pipelineId') pipelineId?: string,
    @Query('stageId') stageId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dealsService.getDeals(user.organizationId, {
      pipelineId,
      stageId,
      assignedTo,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create new deal' })
  async createDeal(@CurrentUser() user: any, @Body() body: any) {
    return this.dealsService.createDeal(user.organizationId, {
      ...body,
      ownerId: body.ownerId || body.assignedToId || user.id,
    });
  }

  @Put(':id/stage')
  @ApiOperation({ summary: 'Move deal to another pipeline stage' })
  async moveDeal(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('stageId') stageId: string,
  ) {
    return this.dealsService.moveDeal(user.organizationId, id, stageId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update deal details' })
  async updateDeal(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.dealsService.updateDeal(user.organizationId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete deal' })
  async deleteDeal(@CurrentUser() user: any, @Param('id') id: string) {
    return this.dealsService.deleteDeal(user.organizationId, id);
  }
}
