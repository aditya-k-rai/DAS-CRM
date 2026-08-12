import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async log(organizationId: string, userId: string, dto: {
    activityType: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'WHATSAPP' | 'SMS' | 'VISIT';
    leadId?: string;
    contactId?: string;
    dealId?: string;
    subject?: string;
    notes: string;
    durationMin?: number;
    outcome?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    nextAction?: string;
    nextActionDate?: Date;
  }) {
    return this.prisma.activity.create({
      data: {
        organizationId,
        userId,
        activityType:   dto.activityType,
        leadId:         dto.leadId,
        contactId:      dto.contactId,
        dealId:         dto.dealId,
        subject:        dto.subject,
        notes:          dto.notes,
        durationMin:    dto.durationMin,
        outcome:        dto.outcome,
        nextAction:     dto.nextAction,
        nextActionDate: dto.nextActionDate,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async getTimeline(organizationId: string, opts: {
    leadId?: string;
    contactId?: string;
    dealId?: string;
    page?: number;
    limit?: number;
  }) {
    const { leadId, contactId, dealId, page = 1, limit = 20 } = opts;
    const where: any = {
      organizationId,
      ...(leadId    && { leadId }),
      ...(contactId && { contactId }),
      ...(dealId    && { dealId }),
    };

    const [total, items] = await Promise.all([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
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

    const byType = activities.reduce((acc, a) => {
      acc[a.activityType] = (acc[a.activityType] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { activities, byType, total: activities.length };
  }
}
