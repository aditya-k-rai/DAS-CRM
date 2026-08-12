import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async getPipelines(organizationId: string) {
    return this.prisma.pipeline.findMany({
      where: { organizationId },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
      orderBy: { isDefault: 'desc' },
    });
  }

  async getDeals(organizationId: string, opts: {
    pipelineId?: string;
    stageId?: string;
    assignedTo?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { pipelineId, stageId, assignedTo, search, page = 1, limit = 50 } = opts;
    const where: any = {
      organizationId,
      ...(pipelineId && { pipelineId }),
      ...(stageId && { stageId }),
      ...(assignedTo && { assignedToId: assignedTo }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { contact: { firstName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [total, items] = await Promise.all([
      this.prisma.deal.count({ where }),
      this.prisma.deal.findMany({
        where,
        include: {
          stage:      { select: { id: true, name: true, probability: true } },
          pipeline:   { select: { id: true, name: true } },
          contact:    { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, items };
  }

  async createDeal(organizationId: string, dto: {
    title: string; pipelineId: string; stageId: string; contactId?: string;
    assignedToId?: string; value?: number; expectedCloseDate?: Date;
    probability?: number; notes?: string;
  }) {
    return this.prisma.deal.create({
      data: {
        organizationId,
        title:             dto.title,
        pipelineId:        dto.pipelineId,
        stageId:           dto.stageId,
        contactId:         dto.contactId,
        assignedToId:      dto.assignedToId,
        value:             dto.value ?? 0,
        probability:       dto.probability ?? 20,
        expectedCloseDate: dto.expectedCloseDate,
        notes:             dto.notes,
      },
      include: { stage: true, pipeline: true },
    });
  }

  async moveDeal(organizationId: string, dealId: string, stageId: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id: dealId, organizationId } });
    if (!deal) throw new NotFoundException('Deal not found');

    const stage = await this.prisma.pipelineStage.findFirst({ where: { id: stageId } });
    if (!stage) throw new NotFoundException('Stage not found');

    return this.prisma.deal.update({
      where: { id: dealId },
      data: {
        stageId,
        probability: stage.probability,
        wonAt:  stage.isWon  ? new Date() : null,
        lostAt: stage.isLost ? new Date() : null,
      },
    });
  }

  async updateDeal(organizationId: string, id: string, dto: any) {
    const deal = await this.prisma.deal.findFirst({ where: { id, organizationId } });
    if (!deal) throw new NotFoundException('Deal not found');
    return this.prisma.deal.update({ where: { id }, data: dto });
  }

  async deleteDeal(organizationId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id, organizationId } });
    if (!deal) throw new NotFoundException('Deal not found');
    await this.prisma.deal.delete({ where: { id } });
    return { success: true };
  }

  async getForecast(organizationId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { organizationId, wonAt: null, lostAt: null },
      include: { stage: true },
    });

    const totalPipeline = deals.reduce((s, d) => s + Number(d.value), 0);
    const weightedValue = deals.reduce((s, d) => s + (Number(d.value) * (d.probability / 100)), 0);

    const byStage = deals.reduce((acc, d) => {
      const key = d.stage?.name ?? 'Unknown';
      if (!acc[key]) acc[key] = { count: 0, value: 0, weighted: 0 };
      acc[key].count++;
      acc[key].value += Number(d.value);
      acc[key].weighted += Number(d.value) * (d.probability / 100);
      return acc;
    }, {} as Record<string, any>);

    return { totalPipeline, weightedValue, byStage, dealsCount: deals.length };
  }
}
