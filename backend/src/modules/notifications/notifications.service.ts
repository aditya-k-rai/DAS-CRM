import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH' | 'WHATSAPP';
export type NotificationEvent =
  | 'LEAD_ASSIGNED'
  | 'LEAD_STATUS_CHANGED'
  | 'LEAD_SCORE_THRESHOLD'
  | 'TASK_ASSIGNED'
  | 'TASK_OVERDUE'
  | 'DEAL_STAGE_MOVED'
  | 'DEAL_WON'
  | 'DEAL_LOST'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'SALARY_GENERATED'
  | 'AUTOMATION_TRIGGERED'
  | 'MENTION';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

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
    const { organizationId, recipientIds, title, body, linkUrl, metadata } =
      opts;

    const records = recipientIds.map((userId) => ({
      organizationId,
      userId,
      type: 'SYSTEM' as const,
      title,
      body,
      data: { ...(metadata ?? {}), linkUrl },
      isRead: false,
    }));

    await this.prisma.notification.createMany({ data: records });

    return { sent: recipientIds.length };
  }

  /** Get all notifications for a user */
  async getUserNotifications(
    organizationId: string,
    userId: string,
    opts: { unreadOnly?: boolean; page?: number; limit?: number },
  ) {
    const { unreadOnly, page = 1, limit = 30 } = opts;
    const where: any = {
      organizationId,
      userId,
      ...(unreadOnly && { isRead: false }),
    };

    const [total, unreadCount, items] = await Promise.all([
      this.prisma.notification.count({ where: { organizationId, userId } }),
      this.prisma.notification.count({
        where: { organizationId, userId, isRead: false },
      }),
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
      data: { isRead: true },
    });
    return { success: true };
  }

  async markAllRead(organizationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { organizationId, userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  /** Notify all users in an org with a specific role */
  async notifyByRole(
    organizationId: string,
    roleFilter: string[],
    opts: Omit<
      Parameters<typeof this.send>[0],
      'recipientIds' | 'organizationId'
    >,
  ) {
    const users = await this.prisma.user.findMany({
      where: { organizationId, role: { name: { in: roleFilter } } },
      select: { id: true },
    });
    if (!users.length) return { sent: 0 };
    return this.send({
      organizationId,
      recipientIds: users.map((u) => u.id),
      ...opts,
    });
  }

  /** Helper: fire LEAD_ASSIGNED notification */
  async notifyLeadAssigned(
    organizationId: string,
    assigneeId: string,
    leadName: string,
    leadId: string,
  ) {
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
      where: { organizationId, isCompleted: false, dueAt: { lt: new Date() } },
      include: { assignee: { select: { id: true } } },
    });

    for (const task of overdue) {
      if (!task.assigneeId) continue;
      await this.send({
        organizationId,
        recipientIds: [task.assigneeId],
        event: 'TASK_OVERDUE',
        title: `Task Overdue: ${task.title}`,
        body: `This task was due ${task.dueAt?.toLocaleDateString('en-IN')}. Please complete it or reschedule.`,
        linkUrl: `/tasks/${task.id}`,
        channels: ['IN_APP', 'PUSH'],
      });
    }

    return { notified: overdue.length };
  }

  /**
   * Admin Access Guard & Push Dispatcher:
   * Dispatches Web Push + Mobile App Push (FCM / Expo) to Whitelisted Managers
   * when a new lead enters the Acquire Pool queue.
   */
  async notifyNewAcquirePoolLead(opts: {
    organizationId: string;
    serialNo: string;
    leadId: string;
    sourceName?: string;
    whitelistedUserIds?: string[];
  }) {
    const { organizationId, serialNo, leadId, sourceName, whitelistedUserIds } = opts;

    let recipientIds = whitelistedUserIds ?? [];

    if (!recipientIds.length) {
      const managers = await this.prisma.user.findMany({
        where: {
          organizationId,
          isActive: true,
          role: { name: { in: ['ADMIN', 'MANAGER', 'OWNER'] } },
        },
        select: { id: true },
      });
      recipientIds = managers.map((u) => u.id);
    }

    if (!recipientIds.length) return { sent: 0 };

    return this.send({
      organizationId,
      recipientIds,
      event: 'AUTOMATION_TRIGGERED',
      title: '⚡ New Lead in Acquire Pool',
      body: `New Lead Available in Acquire Pool (#${serialNo}) via ${sourceName || 'Web Queue'}`,
      linkUrl: `/leads?tab=funnel`,
      channels: ['IN_APP', 'PUSH'],
      metadata: {
        action: 'ACQUIRE_POOL',
        leadId,
        serialNo,
        pushChannels: ['WEB_WEBSOCKET', 'FCM_EXPO_MOBILE'],
      },
    });
  }
}
