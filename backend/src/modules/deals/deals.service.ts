import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DealStatus } from '@prisma/client';

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

  async getDeals(
    organizationId: string,
    opts: {
      pipelineId?: string;
      stageId?: string;
      assignedTo?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const {
      pipelineId,
      stageId,
      assignedTo,
      search,
      page = 1,
      limit = 50,
    } = opts;
    const where: any = {
      organizationId,
      ...(pipelineId && { pipelineId }),
      ...(stageId && { stageId }),
      ...(assignedTo && { ownerId: assignedTo }),
      ...(search && {
        OR: [{ title: { contains: search, mode: 'insensitive' } }],
      }),
    };

    const [total, items] = await Promise.all([
      this.prisma.deal.count({ where }),
      this.prisma.deal.findMany({
        where,
        include: {
          stage: { select: { id: true, name: true, probability: true } },
          pipeline: { select: { id: true, name: true } },
          owner: { select: { id: true, firstName: true, lastName: true } },
          company: { select: { id: true, name: true } },
          lead: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, items };
  }

  async createDeal(
    organizationId: string,
    dto: {
      title: string;
      pipelineId?: string;
      stageId?: string;
      leadId?: string;
      companyId?: string;
      assignedToId?: string;
      ownerId?: string;
      value?: number;
      expectedCloseDate?: Date;
      expectedCloseAt?: Date;
      notes?: string;
    },
  ) {
    return this.prisma.deal.create({
      data: {
        organizationId,
        title: dto.title,
        pipelineId: dto.pipelineId,
        stageId: dto.stageId,
        leadId: dto.leadId,
        companyId: dto.companyId,
        ownerId: dto.ownerId ?? dto.assignedToId,
        value: dto.value ?? 0,
        expectedCloseAt: dto.expectedCloseAt ?? dto.expectedCloseDate,
        notes: dto.notes
          ? { create: { organizationId, content: dto.notes } }
          : undefined,
      },
      include: { stage: true, pipeline: true },
    });
  }

  async moveDeal(organizationId: string, dealId: string, stageId: string) {
    // Fetch deal and its target stage in a single query
    const [deal, stage] = await Promise.all([
      this.prisma.deal.findFirst({ where: { id: dealId, organizationId } }),
      this.prisma.stage.findFirst({ where: { id: stageId } }),
    ]);
    if (!deal) throw new NotFoundException('Deal not found');
    if (!stage) throw new NotFoundException('Stage not found');

    const isWon = stage.name.toLowerCase().includes('won');
    const isLost = stage.name.toLowerCase().includes('lost');

    return this.prisma.deal.update({
      where: { id: dealId },
      data: {
        stageId,
        status: isWon
          ? DealStatus.WON
          : isLost
            ? DealStatus.LOST
            : DealStatus.OPEN,
        closedAt: isWon || isLost ? new Date() : null,
      },
    });
  }

  async updateDeal(organizationId: string, id: string, dto: any) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    return this.prisma.deal.update({ where: { id }, data: dto });
  }

  async deleteDeal(organizationId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    await this.prisma.deal.delete({ where: { id } });
    return { success: true };
  }

  async getForecast(organizationId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { organizationId, status: DealStatus.OPEN },
      include: { stage: true },
    });

    const totalPipeline = deals.reduce((s, d) => s + Number(d.value), 0);
    const weightedValue = deals.reduce(
      (s, d) => s + Number(d.value) * ((d.stage?.probability ?? 0) / 100),
      0,
    );

    const byStage = deals.reduce(
      (acc, d) => {
        const key = d.stage?.name ?? 'Unknown';
        const prob = d.stage?.probability ?? 0;
        if (!acc[key]) acc[key] = { count: 0, value: 0, weighted: 0 };
        acc[key].count++;
        acc[key].value += Number(d.value);
        acc[key].weighted += Number(d.value) * (prob / 100);
        return acc;
      },
      {} as Record<string, any>,
    );

    return { totalPipeline, weightedValue, byStage, dealsCount: deals.length };
  }
}
