import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityType } from '@prisma/client';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    @Optional() private realtimeService?: RealtimeService,
  ) {}

  async log(
    organizationId: string,
    userId: string,
    dto: {
      activityType:
        | 'CALL'
        | 'EMAIL'
        | 'MEETING'
        | 'NOTE'
        | 'TASK'
        | 'STATUS_CHANGE'
        | 'IMPORT'
        | 'SYSTEM';
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
    const typeEnum = Object.values(ActivityType).includes(dto.activityType)
      ? dto.activityType
      : 'NOTE';

    const mergedMetadata = {
      ...(dto.metadata || {}),
      subject: dto.subject || dto.metadata?.subject,
      durationMin: dto.durationMin ?? (dto.durationSeconds ? Math.ceil(dto.durationSeconds / 60) : undefined) ?? dto.metadata?.durationMin,
      durationSeconds: dto.durationSeconds ?? dto.metadata?.durationSeconds,
      outcome: dto.outcome || dto.metadata?.outcome,
      nextAction: dto.nextAction || dto.metadata?.nextAction,
      nextActionDate: dto.nextActionDate || dto.metadata?.nextActionDate,
    };

    const activity = await this.prisma.activity.create({
      data: {
        organizationId,
        userId,
        type: typeEnum,
        leadId: dto.leadId,
        contactId: dto.contactId,
        dealId: dto.dealId,
        description: dto.notes,
        metadata: mergedMetadata,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    if (dto.leadId) {
      await this.prisma.lead.update({
        where: { id: dto.leadId },
        data: { lastActivityAt: new Date() },
      }).catch(() => {});
    }

    if (this.realtimeService) {
      this.realtimeService.emitDomainEvent({
        event: 'lead.updated',
        organizationId,
        leadId: dto.leadId,
        actorId: userId,
        changes: { activity: typeEnum, description: dto.notes },
        timestamp: new Date().toISOString(),
      });
    }

    return activity;
  }

  async getTimeline(
    organizationId: string,
    opts: {
      leadId?: string;
      contactId?: string;
      dealId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { leadId, contactId, dealId, page = 1, limit = 20 } = opts;
    const where: any = {
      organizationId,
      ...(leadId && { leadId }),
      ...(contactId && { contactId }),
      ...(dealId && { dealId }),
    };

    const [total, items] = await Promise.all([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, items };
  }

  async getUserActivity(organizationId: string, userId: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const activities = await this.prisma.activity.findMany({
      where: { organizationId, userId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });

    const byType = activities.reduce(
      (acc, a) => {
        acc[a.type] = (acc[a.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { activities, byType, total: activities.length };
  }

  /**
   * Get today's sales, calls, messages, and pipeline telemetry for dashboard.
   */
  async getTodaySummary(organizationId: string) {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDateStr = new Date(now.getTime() + istOffset).toISOString().split('T')[0];
    const todayStart = new Date(`${istDateStr}T00:00:00.000+05:30`);
    const todayEnd = new Date(`${istDateStr}T23:59:59.999+05:30`);

    const [todayCalls, todayMsgs, todayLeads, totalLeads, wonLeads, allDeals] = await Promise.all([
      // Calls today
      this.prisma.activity.count({
        where: {
          organizationId,
          createdAt: { gte: todayStart, lte: todayEnd },
          OR: [
            { type: 'CALL' },
            { description: { contains: 'call', mode: 'insensitive' } },
          ],
        },
      }),
      // Messages today (WhatsApp, Email)
      this.prisma.activity.count({
        where: {
          organizationId,
          createdAt: { gte: todayStart, lte: todayEnd },
          OR: [
            { type: 'EMAIL' },
            { description: { contains: 'whatsapp', mode: 'insensitive' } },
            { description: { contains: 'email', mode: 'insensitive' } },
          ],
        },
      }),
      // Leads created today
      this.prisma.lead.count({
        where: {
          organizationId,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      // Total leads
      this.prisma.lead.count({
        where: { organizationId },
      }),
      // Won leads
      this.prisma.lead.count({
        where: {
          organizationId,
          status: { name: { equals: 'Won', mode: 'insensitive' } },
        },
      }),
      // Deals for pipeline & sales
      this.prisma.deal.findMany({
        where: { organizationId },
        select: { id: true, value: true, status: true, updatedAt: true, stage: { select: { name: true } } },
      }),
    ]);

    let totalSalesWon = 0;
    let salesToday = 0;
    let activePipeline = 0;

    allDeals.forEach((deal) => {
      const val = Number(deal.value) || 0;
      const isWon = (deal as any).status === 'WON' || deal.stage?.name?.toUpperCase() === 'WON';
      const isLost = (deal as any).status === 'LOST' || deal.stage?.name?.toUpperCase() === 'LOST';
      if (isWon) {
        totalSalesWon += val;
        if (deal.updatedAt >= todayStart && deal.updatedAt <= todayEnd) {
          salesToday += val;
        }
      } else if (!isLost) {
        activePipeline += val;
      }
    });

    if (totalSalesWon === 0 && wonLeads > 0) {
      const wonLeadRecords = await this.prisma.lead.findMany({
        where: { organizationId, status: { name: { equals: 'Won', mode: 'insensitive' } } },
        select: { customFields: true, updatedAt: true },
      });
      wonLeadRecords.forEach((l) => {
        const cf = (l.customFields as any) || {};
        const bStr = cf.Budget || cf.budget || cf.value || '0';
        const num = parseFloat(String(bStr).replace(/[^0-9.]/g, '')) || 0;
        totalSalesWon += num;
        if (l.updatedAt >= todayStart && l.updatedAt <= todayEnd) {
          salesToday += num;
        }
      });
    }

    if (activePipeline === 0) {
      const activeLeads = await this.prisma.lead.findMany({
        where: {
          organizationId,
          status: { name: { notIn: ['Won', 'Lost'] } },
        },
        select: { customFields: true },
      });
      activeLeads.forEach((l) => {
        const cf = (l.customFields as any) || {};
        const bStr = cf.Budget || cf.budget || cf.value || '0';
        const num = parseFloat(String(bStr).replace(/[^0-9.]/g, '')) || 0;
        activePipeline += num;
      });
    }

    const conversionRate = totalLeads > 0 ? parseFloat(((wonLeads / totalLeads) * 100).toFixed(1)) : 0;

    return {
      salesToday,
      totalSalesWon,
      activePipeline,
      todayLeads,
      totalLeads,
      todayCalls,
      todayMsgs,
      wonLeads,
      conversionRate,
    };
  }
}
