import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PipelinesService } from './pipelines.service';

@ApiTags('Pipelines')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  private getOrgId(req: any): string {
    return req.user?.organizationId || req.user?.org_id || '';
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales pipelines for tenant' })
  getPipelines(@Req() req: any) {
    return this.pipelinesService.getPipelines(this.getOrgId(req));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pipeline by ID' })
  getPipeline(@Param('id') id: string, @Req() req: any) {
    return this.pipelinesService.getPipeline(this.getOrgId(req), id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new sales pipeline' })
  createPipeline(
    @Body()
    dto: {
      name: string;
      isDefault?: boolean;
      stages?: { name: string; probability?: number; color?: string }[];
    },
    @Req() req: any,
  ) {
    return this.pipelinesService.createPipeline(this.getOrgId(req), dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update pipeline details' })
  updatePipeline(
    @Param('id') id: string,
    @Body() dto: { name?: string; isDefault?: boolean },
    @Req() req: any,
  ) {
    return this.pipelinesService.updatePipeline(this.getOrgId(req), id, dto);
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set pipeline as default' })
  setDefaultPipeline(@Param('id') id: string, @Req() req: any) {
    return this.pipelinesService.setDefaultPipeline(this.getOrgId(req), id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete pipeline' })
  deletePipeline(@Param('id') id: string, @Req() req: any) {
    return this.pipelinesService.deletePipeline(this.getOrgId(req), id);
  }

  @Post(':id/stages')
  @ApiOperation({ summary: 'Add a new stage to pipeline' })
  addStage(
    @Param('id') pipelineId: string,
    @Body() dto: { name: string; probability?: number; color?: string },
    @Req() req: any,
  ) {
    return this.pipelinesService.addStage(this.getOrgId(req), pipelineId, dto);
  }

  @Patch('stages/:stageId')
  @ApiOperation({ summary: 'Update a stage definition' })
  updateStage(
    @Param('stageId') stageId: string,
    @Body() dto: { name?: string; probability?: number; color?: string; order?: number },
    @Req() req: any,
  ) {
    return this.pipelinesService.updateStage(this.getOrgId(req), stageId, dto);
  }

  @Delete('stages/:stageId')
  @ApiOperation({ summary: 'Delete a stage' })
  deleteStage(@Param('stageId') stageId: string, @Req() req: any) {
    return this.pipelinesService.deleteStage(this.getOrgId(req), stageId);
  }

  @Patch(':id/reorder-stages')
  @ApiOperation({ summary: 'Reorder stages in pipeline' })
  reorderStages(
    @Param('id') pipelineId: string,
    @Body() dto: { stageOrders: { id: string; order: number }[] },
    @Req() req: any,
  ) {
    return this.pipelinesService.reorderStages(
      this.getOrgId(req),
      pipelineId,
      dto.stageOrders,
    );
  }
}
