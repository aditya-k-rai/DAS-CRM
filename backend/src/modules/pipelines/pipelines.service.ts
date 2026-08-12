import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PipelinesService {
  constructor(private prisma: PrismaService) {}

  /** Get all pipelines for an organization with ordered stages */
  async getPipelines(organizationId: string) {
    const pipelines = await this.prisma.pipeline.findMany({
      where: { organizationId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { deals: true } } },
        },
        _count: { select: { deals: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return pipelines;
  }

  /** Get a single pipeline by ID */
  async getPipeline(organizationId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, organizationId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { deals: true } } },
        },
        _count: { select: { deals: true } },
      },
    });

    if (!pipeline) throw new NotFoundException('Pipeline not found');
    return pipeline;
  }

  /** Create a new sales pipeline with custom or default stages */
  async createPipeline(
    organizationId: string,
    dto: {
      name: string;
      isDefault?: boolean;
      stages?: { name: string; probability?: number; color?: string }[];
    },
  ) {
    if (dto.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { organizationId },
        data: { isDefault: false },
      });
    }

    const defaultStages = dto.stages && dto.stages.length > 0
      ? dto.stages
      : [
          { name: 'Prospecting', probability: 10, color: '#6366f1' },
          { name: 'Qualification', probability: 25, color: '#f59e0b' },
          { name: 'Proposal', probability: 50, color: '#3b82f6' },
          { name: 'Negotiation', probability: 75, color: '#8b5cf6' },
          { name: 'Closed Won', probability: 100, color: '#22c55e' },
        ];

    const pipeline = await this.prisma.pipeline.create({
      data: {
        organizationId,
        name: dto.name,
        isDefault: dto.isDefault ?? false,
        stages: {
          create: defaultStages.map((s, index) => ({
            name: s.name,
            order: index,
            probability: s.probability ?? 50,
            color: s.color ?? '#6366f1',
          })),
        },
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });

    return pipeline;
  }

  /** Update pipeline details */
  async updatePipeline(
    organizationId: string,
    id: string,
    dto: { name?: string; isDefault?: boolean },
  ) {
    const existing = await this.prisma.pipeline.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException('Pipeline not found');

    if (dto.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { organizationId },
        data: { isDefault: false },
      });
    }

    return this.prisma.pipeline.update({
      where: { id },
      data: {
        name: dto.name,
        isDefault: dto.isDefault,
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  /** Set pipeline as default */
  async setDefaultPipeline(organizationId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, organizationId },
    });
    if (!pipeline) throw new NotFoundException('Pipeline not found');

    await this.prisma.$transaction([
      this.prisma.pipeline.updateMany({
        where: { organizationId },
        data: { isDefault: false },
      }),
      this.prisma.pipeline.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    return { message: `${pipeline.name} is now the default sales pipeline` };
  }

  /** Delete a pipeline */
  async deletePipeline(organizationId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, organizationId },
      include: { _count: { select: { deals: true } } },
    });

    if (!pipeline) throw new NotFoundException('Pipeline not found');
    if (pipeline.isDefault) {
      throw new BadRequestException('Cannot delete the default sales pipeline');
    }
    if (pipeline._count.deals > 0) {
      throw new BadRequestException(
        `Cannot delete pipeline with ${pipeline._count.deals} active deals. Reassign deals first.`,
      );
    }

    await this.prisma.pipeline.delete({ where: { id } });
    return { message: 'Pipeline deleted successfully' };
  }

  /** Add a new stage to a pipeline */
  async addStage(
    organizationId: string,
    pipelineId: string,
    dto: { name: string; probability?: number; color?: string },
  ) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId },
      include: { stages: { orderBy: { order: 'desc' }, take: 1 } },
    });
    if (!pipeline) throw new NotFoundException('Pipeline not found');

    const nextOrder = pipeline.stages.length > 0 ? pipeline.stages[0].order + 1 : 0;

    return this.prisma.stage.create({
      data: {
        pipelineId,
        name: dto.name,
        order: nextOrder,
        probability: dto.probability ?? 50,
        color: dto.color ?? '#6366f1',
      },
    });
  }

  /** Update a stage definition */
  async updateStage(
    organizationId: string,
    stageId: string,
    dto: { name?: string; probability?: number; color?: string; order?: number },
  ) {
    const stage = await this.prisma.stage.findFirst({
      where: { id: stageId, pipeline: { organizationId } },
    });
    if (!stage) throw new NotFoundException('Stage not found');

    return this.prisma.stage.update({
      where: { id: stageId },
      data: {
        name: dto.name,
        probability: dto.probability,
        color: dto.color,
        order: dto.order,
      },
    });
  }

  /** Delete a stage */
  async deleteStage(organizationId: string, stageId: string) {
    const stage = await this.prisma.stage.findFirst({
      where: { id: stageId, pipeline: { organizationId } },
      include: { _count: { select: { deals: true } } },
    });
    if (!stage) throw new NotFoundException('Stage not found');

    if (stage._count.deals > 0) {
      throw new BadRequestException(
        `Cannot delete stage containing ${stage._count.deals} deals. Move deals to another stage first.`,
      );
    }

    await this.prisma.stage.delete({ where: { id: stageId } });
    return { message: 'Stage deleted successfully' };
  }

  /** Reorder stages in batch */
  async reorderStages(
    organizationId: string,
    pipelineId: string,
    stageOrders: { id: string; order: number }[],
  ) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId },
    });
    if (!pipeline) throw new NotFoundException('Pipeline not found');

    await this.prisma.$transaction(
      stageOrders.map((s) =>
        this.prisma.stage.update({
          where: { id: s.id },
          data: { order: s.order },
        }),
      ),
    );

    return { message: 'Stages reordered successfully' };
  }
}
