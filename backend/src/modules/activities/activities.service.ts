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

    const mergedMetadata: Record<string, any> = {
      ...(dto.metadata || {}),
      subject: dto.subject || dto.metadata?.subject,
      durationMin: dto.durationMin ?? (dto.durationSeconds ? Math.ceil(dto.durationSeconds / 60) : undefined) ?? dto.metadata?.durationMin,
      durationSeconds: dto.durationSeconds ?? dto.metadata?.durationSeconds,
      outcome: dto.outcome || dto.metadata?.outcome,
      nextAction: dto.nextAction || dto.metadata?.nextAction,
      nextActionDate: dto.nextActionDate || dto.metadata?.nextActionDate,
    };

    // Safe validation of leadId against organization's leads to prevent foreign key errors on offline drafts
    let validLeadId: string | undefined = undefined;
    if (dto.leadId) {
      try {
        const lead = await this.prisma.lead.findFirst({
          where: {
            organizationId,
            OR: [
              { id: dto.leadId },
              ...(dto.metadata?.phone ? [{ phone: { contains: String(dto.metadata.phone).replace(/[^0-9]/g, '') } }] : []),
              ...(dto.metadata?.leadPhone ? [{ phone: { contains: String(dto.metadata.leadPhone).replace(/[^0-9]/g, '') } }] : []),
            ],
          },
        });
        if (lead) validLeadId = lead.id;
      } catch (_) {}
    }

    // Guard: reject corrupted or phantom test reconciliation payloads
    if (
      dto.notes?.includes('This is Test Discription') ||
      dto.notes?.includes('Old Jacket 1 (Qty: 1 · ₹10,499') ||
      ((mergedMetadata.reconciledFromLocal || mergedMetadata.reconciledFromDevice) && !validLeadId)
    ) {
      return { id: 'ignored_phantom', type: typeEnum, description: dto.notes, createdAt: new Date() };
    }

    // Deduplication check: prevent duplicate activity spamming within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingActivity = await this.prisma.activity.findFirst({
      where: {
        organizationId,
        userId,
        type: typeEnum,
        leadId: validLeadId,
        description: dto.notes,
        createdAt: { gte: fiveMinutesAgo },
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

    if (existingActivity) {
      return existingActivity;
    }

    const activity = await this.prisma.activity.create({
      data: {
        organizationId,
        userId,
        type: typeEnum,
        leadId: validLeadId,
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

    if (validLeadId) {
      await this.prisma.lead.update({
        where: { id: validLeadId },
        data: { lastActivityAt: new Date() },
      }).catch(() => {});
    }

    // ⚡ Automatic Two-Way Synchronization to CRM Follow-up Pipeline
    const followUpDateStr = mergedMetadata.followUpDate || (dto.nextActionDate ? new Date(dto.nextActionDate).toISOString().slice(0, 10) : undefined);
    if (followUpDateStr && validLeadId && !mergedMetadata.followUpId) {
      try {
        const timeStr = mergedMetadata.followUpTime || '10:00 AM';
        const isMeeting = dto.activityType === 'MEETING' || mergedMetadata.scheduledType === 'MEETING' || dto.outcome === 'MEETING_SCHEDULED';
        const channelType = isMeeting ? 'MEETING' : (mergedMetadata.channel === 'WHATSAPP_DIRECT' ? 'WHATSAPP' : 'CALL');

        let dueAt: Date;
        try {
          let hours = 10;
          let mins = 0;
          if (timeStr) {
            const isPM = /pm/i.test(timeStr);
            const isAM = /am/i.test(timeStr);
            const clean = timeStr.replace(/[^\d:]/g, '');
            const parts = clean.split(':');
            if (parts.length >= 2) {
              let h = parseInt(parts[0], 10) || 10;
              mins = parseInt(parts[1], 10) || 0;
              if (isPM && h < 12) h += 12;
              if (isAM && h === 12) h = 0;
              hours = h;
            }
          }
          const hh = String(hours).padStart(2, '0');
          const mm = String(mins).padStart(2, '0');
          dueAt = new Date(`${followUpDateStr}T${hh}:${mm}:00+05:30`);
          if (isNaN(dueAt.getTime())) {
            dueAt = new Date(followUpDateStr);
          }
        } catch (_) {
          dueAt = new Date();
        }

        const existingTask = await this.prisma.task.findFirst({
          where: {
            organizationId,
            leadId: validLeadId,
            isCompleted: false,
            dueAt: {
              gte: new Date(dueAt.getTime() - 2 * 60 * 60 * 1000),
              lte: new Date(dueAt.getTime() + 2 * 60 * 60 * 1000),
            },
          },
        });

        if (existingTask) {
          // Task already exists, link activity to it without creating duplicate
          mergedMetadata.followUpId = existingTask.id;
          await this.prisma.activity.update({
            where: { id: activity.id },
            data: { metadata: mergedMetadata },
          }).catch(() => {});
        } else {
          const lead = await this.prisma.lead.findUnique({
            where: { id: validLeadId },
            select: { firstName: true, lastName: true, phone: true },
          });
          const leadFullName = lead ? `${lead.firstName} ${lead.lastName || ''}`.trim() : 'Lead Prospect';
          const title = isMeeting
            ? `🏢 In-Person / Virtual Visit: ${leadFullName}`
            : `📞 Callback: ${leadFullName}${lead?.phone ? ` (${lead?.phone})` : ''}`;

          const createdTask = await this.prisma.task.create({
            data: {
              organizationId,
              createdById: userId,
              assigneeId: userId,
              leadId: validLeadId,
              contactId: dto.contactId,
              dealId: dto.dealId,
              title,
              description: dto.notes || `Scheduled via ${dto.activityType}`,
              purpose: dto.notes || `Follow-up scheduled from ${dto.activityType}`,
              taskType: 'FOLLOW_UP',
              followUpType: channelType,
              priority: 'HIGH',
              status: 'PENDING',
              dueAt,
              reminderAt: new Date(dueAt.getTime() - 5 * 60 * 1000),
              isCompleted: false,
            },
          });

          // Link task ID back to activity metadata
          mergedMetadata.followUpId = createdTask.id;
          await this.prisma.activity.update({
            where: { id: activity.id },
            data: { metadata: mergedMetadata },
          }).catch(() => {});
        }
      } catch (syncErr) {
        // Safe failover so logging never interrupts user flow
      }
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
    const { leadId, contactId, dealId, page = 1, limit = 50 } = opts;

    let leadIds: string[] = [];
    if (leadId) {
      leadIds.push(leadId);
      try {
        const targetLead = await this.prisma.lead.findUnique({
          where: { id: leadId },
          select: { id: true, phone: true },
        });
        if (targetLead?.phone) {
          const raw = targetLead.phone;
          const digits = raw.replace(/[^0-9]/g, '');
          const last10 = digits.slice(-10);
          const chunk1 = last10.length >= 5 ? last10.slice(0, 5) : '';
          const chunk2 = last10.length >= 10 ? last10.slice(5) : '';

          const orPhoneConditions: any[] = [
            { phone: { contains: raw } },
          ];
          if (last10.length >= 7) {
            orPhoneConditions.push({ phone: { contains: last10 } });
          }
          if (chunk1 && chunk2) {
            orPhoneConditions.push({
              AND: [
                { phone: { contains: chunk1 } },
                { phone: { contains: chunk2 } },
              ],
            });
          }

          const duplicates = await this.prisma.lead.findMany({
            where: {
              organizationId,
              OR: orPhoneConditions,
            },
            select: { id: true },
          });

          duplicates.forEach((d) => {
            if (!leadIds.includes(d.id)) leadIds.push(d.id);
          });
        }
      } catch (_) {}
    }

    const where: any = {
      organizationId,
      ...(leadIds.length > 1
        ? { leadId: { in: leadIds } }
        : leadIds.length === 1
        ? { leadId: leadIds[0] }
        : {}),
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
