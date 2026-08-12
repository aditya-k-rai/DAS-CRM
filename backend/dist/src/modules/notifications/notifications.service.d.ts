import { PrismaService } from '../../prisma/prisma.service';
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH' | 'WHATSAPP';
export type NotificationEvent = 'LEAD_ASSIGNED' | 'LEAD_STATUS_CHANGED' | 'LEAD_SCORE_THRESHOLD' | 'TASK_ASSIGNED' | 'TASK_OVERDUE' | 'DEAL_STAGE_MOVED' | 'DEAL_WON' | 'DEAL_LOST' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'SALARY_GENERATED' | 'AUTOMATION_TRIGGERED' | 'MENTION';
export declare class NotificationsService {
    private prisma;
    constructor(prisma: PrismaService);
    send(opts: {
        organizationId: string;
        recipientIds: string[];
        event: NotificationEvent;
        title: string;
        body: string;
        linkUrl?: string;
        channels?: NotificationChannel[];
        metadata?: Record<string, any>;
    }): Promise<{
        sent: number;
    }>;
    getUserNotifications(organizationId: string, userId: string, opts: {
        unreadOnly?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        total: number;
        unreadCount: number;
        page: number;
        limit: number;
        items: {
            id: string;
            organizationId: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue;
            userId: string;
            type: import("@prisma/client").$Enums.NotificationType;
            title: string;
            body: string | null;
            isRead: boolean;
        }[];
    }>;
    markRead(organizationId: string, userId: string, ids: string[]): Promise<{
        success: boolean;
    }>;
    markAllRead(organizationId: string, userId: string): Promise<{
        success: boolean;
    }>;
    notifyByRole(organizationId: string, roleFilter: string[], opts: Omit<Parameters<typeof this.send>[0], 'recipientIds' | 'organizationId'>): Promise<{
        sent: number;
    }>;
    notifyLeadAssigned(organizationId: string, assigneeId: string, leadName: string, leadId: string): Promise<{
        sent: number;
    }>;
    notifyOverdueTasks(organizationId: string): Promise<{
        notified: number;
    }>;
}
