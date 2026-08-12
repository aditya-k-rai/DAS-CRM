import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH' | 'WHATSAPP';
export type NotificationEvent   =
  | 'LEAD_ASSIGNED'    | 'LEAD_STATUS_CHANGED' | 'LEAD_SCORE_THRESHOLD'
  | 'TASK_ASSIGNED'    | 'TASK_OVERDUE'
  | 'DEAL_STAGE_MOVED' | 'DEAL_WON'             | 'DEAL_LOST'
  | 'LEAVE_APPROVED'   | 'LEAVE_REJECTED'
  | 'SALARY_GENERATED' | 'AUTOMATION_TRIGGERED' | 'MENTION';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notifQueue: Queue,
  ) {}

  /** Send a notification to one or more users */
  async send(opts: {
    organizationId: string;
    recipientIds: string[];
    event: NotificationEvent;
    title: string;
    body: string;
    linkUrl?: string;
    channels?: NotificationChannel[];
    metadata?: Record<string, any>;
  }) {
    const { organizationId, recipientIds, event, title, body, linkUrl, channels = ['IN_APP'], metadata } = opts;

    const records = recipientIds.map(userId => ({
      organizationId,
      userId,
      event,
      title,
      body,
      linkUrl,
      metadata: metadata ?? {},
      isRead: false,
    }));

    // Bulk insert all in-app notifications
    await this.prisma.notification.createMany({ data: records });

    // Queue channel-specific deliveries
    for (const userId of recipientIds) {
      if (channels.includes('EMAIL')) {
        await this.notifQueue.add('send-email', { organizationId, userId, event, title, body }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
      }
      if (channels.includes('PUSH')) {
        await this.notifQueue.add('send-push', { organizationId, userId, event, title, body }, { attempts: 2 });
      }
      if (channels.includes('WHATSAPP')) {
        await this.notifQueue.add('send-whatsapp', { organizationId, userId, event, title, body }, { attempts: 2 });
      }
    }

    return { sent: recipientIds.length };
  }

  /** Get all notifications for a user */
  async getUserNotifications(organizationId: string, userId: string, opts: { unreadOnly?: boolean; page?: number; limit?: number }) {
    const { unreadOnly, page = 1, limit = 30 } = opts;
    const where: any = {
      organizationId, userId,
      ...(unreadOnly && { isRead: false }),
    };

    const [total, unreadCount, items] = await Promise.all([
      this.prisma.notification.count({ where: { organizationId, userId } }),
      this.prisma.notification.count({ where: { organizationId, userId, isRead: false } }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, unreadCount, page, limit, items };
  }

  /** Mark as read */
  async markRead(organizationId: string, userId: string, ids: string[]) {
    await this.prisma.notification.updateMany({
      where: { organizationId, userId, id: { in: ids } },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async markAllRead(organizationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { organizationId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  /** Notify all users in an org with a specific role */
  async notifyByRole(organizationId: string, roleFilter: string[], opts: Omit<Parameters<typeof this.send>[0], 'recipientIds' | 'organizationId'>) {
    const users = await this.prisma.user.findMany({
      where: { organizationId, role: { name: { in: roleFilter } } },
      select: { id: true },
    });
    if (!users.length) return { sent: 0 };
    return this.send({ organizationId, recipientIds: users.map(u => u.id), ...opts });
  }

  /** Helper: fire LEAD_ASSIGNED notification */
  async notifyLeadAssigned(organizationId: string, assigneeId: string, leadName: string, leadId: string) {
    return this.send({
      organizationId,
      recipientIds: [assigneeId],
      event: 'LEAD_ASSIGNED',
      title: 'New Lead Assigned',
      body: `${leadName} has been assigned to you.`,
      linkUrl: `/leads/${leadId}`,
      channels: ['IN_APP', 'PUSH'],
    });
  }

  /** Helper: fire TASK_OVERDUE notifications */
  async notifyOverdueTasks(organizationId: string) {
    const overdue = await this.prisma.task.findMany({
      where: { organizationId, completedAt: null, dueDate: { lt: new Date() }, overdueNotifiedAt: null },
      include: { assignee: { select: { id: true } } },
    });

    for (const task of overdue) {
      if (!task.assigneeId) continue;
      await this.send({
        organizationId,
        recipientIds: [task.assigneeId],
        event: 'TASK_OVERDUE',
        title: `Task Overdue: ${task.title}`,
        body: `This task was due ${task.dueDate?.toLocaleDateString('en-IN')}. Please complete it or reschedule.`,
        linkUrl: `/tasks/${task.id}`,
        channels: ['IN_APP', 'PUSH'],
      });
    }

    // Mark them so we don't fire again
    if (overdue.length) {
      await this.prisma.task.updateMany({
        where: { id: { in: overdue.map(t => t.id) } },
        data: { overdueNotifiedAt: new Date() },
      });
    }

    return { notified: overdue.length };
  }
}
