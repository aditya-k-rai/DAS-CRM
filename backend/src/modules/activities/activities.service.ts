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
}
