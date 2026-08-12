"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotificationsService = class NotificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async send(opts) {
        const { organizationId, recipientIds, title, body, linkUrl, metadata } = opts;
        const records = recipientIds.map(userId => ({
            organizationId,
            userId,
            type: 'SYSTEM',
            title,
            body,
            data: { ...(metadata ?? {}), linkUrl },
            isRead: false,
        }));
        await this.prisma.notification.createMany({ data: records });
        return { sent: recipientIds.length };
    }
    async getUserNotifications(organizationId, userId, opts) {
        const { unreadOnly, page = 1, limit = 30 } = opts;
        const where = {
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
    async markRead(organizationId, userId, ids) {
        await this.prisma.notification.updateMany({
            where: { organizationId, userId, id: { in: ids } },
            data: { isRead: true },
        });
        return { success: true };
    }
    async markAllRead(organizationId, userId) {
        await this.prisma.notification.updateMany({
            where: { organizationId, userId, isRead: false },
            data: { isRead: true },
        });
        return { success: true };
    }
    async notifyByRole(organizationId, roleFilter, opts) {
        const users = await this.prisma.user.findMany({
            where: { organizationId, role: { name: { in: roleFilter } } },
            select: { id: true },
        });
        if (!users.length)
            return { sent: 0 };
        return this.send({ organizationId, recipientIds: users.map(u => u.id), ...opts });
    }
    async notifyLeadAssigned(organizationId, assigneeId, leadName, leadId) {
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
    async notifyOverdueTasks(organizationId) {
        const overdue = await this.prisma.task.findMany({
            where: { organizationId, isCompleted: false, dueAt: { lt: new Date() } },
            include: { assignee: { select: { id: true } } },
        });
        for (const task of overdue) {
            if (!task.assigneeId)
                continue;
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
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map