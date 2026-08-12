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
exports.AutomationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let AutomationsService = class AutomationsService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async findAll(organizationId) {
        return this.prisma.automation.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(organizationId, dto) {
        return this.prisma.automation.create({
            data: {
                organizationId,
                name: dto.name,
                trigger: dto.trigger,
                conditions: dto.condition ? [dto.condition] : [],
                actions: dto.actions.map(a => ({ type: a, config: dto.actionConfig ?? {} })),
                isActive: true,
                executionCount: 0,
            },
        });
    }
    async toggleActive(organizationId, id) {
        const rule = await this.prisma.automation.findFirst({ where: { id, organizationId } });
        if (!rule)
            throw new common_1.NotFoundException('Automation rule not found');
        return this.prisma.automation.update({
            where: { id },
            data: { isActive: !rule.isActive },
        });
    }
    async delete(organizationId, id) {
        const rule = await this.prisma.automation.findFirst({ where: { id, organizationId } });
        if (!rule)
            throw new common_1.NotFoundException('Automation rule not found');
        await this.prisma.automation.delete({ where: { id } });
        return { success: true };
    }
    async handleEvent(organizationId, trigger, payload) {
        const rules = await this.prisma.automation.findMany({
            where: { organizationId, trigger: trigger, isActive: true },
        });
        for (const rule of rules) {
            try {
                const actionsList = rule.actions ?? [];
                for (const act of actionsList) {
                    const actionType = typeof act === 'string' ? act : act.type;
                    const actionConfig = typeof act === 'object' && act.config ? act.config : {};
                    await this.executeAction(organizationId, actionType, actionConfig, payload);
                }
                await this.prisma.automation.update({
                    where: { id: rule.id },
                    data: {
                        executionCount: { increment: 1 },
                        lastRunAt: new Date(),
                    },
                });
            }
            catch (err) {
                console.error(`Automation rule ${rule.id} failed:`, err);
            }
        }
    }
    async executeAction(organizationId, action, config, payload) {
        switch (action) {
            case 'SEND_NOTIFICATION':
                if (payload.assigneeId || payload.userId) {
                    await this.notificationsService.send({
                        organizationId,
                        recipientIds: [payload.assigneeId || payload.userId],
                        event: 'AUTOMATION_TRIGGERED',
                        title: config.title || 'Automation Notification',
                        body: config.body || `Triggered by ${payload.name || 'system event'}`,
                    });
                }
                break;
            case 'CREATE_TASK':
                if (payload.leadId || payload.id) {
                    await this.prisma.task.create({
                        data: {
                            organizationId,
                            title: config.taskTitle || `Follow up with ${payload.name || 'lead'}`,
                            leadId: payload.leadId || payload.id,
                            assigneeId: payload.assigneeId || payload.ownerId,
                            dueAt: new Date(Date.now() + (config.dueDays || 1) * 86400000),
                        },
                    });
                }
                break;
            case 'WEBHOOK':
                if (config.webhookUrl) {
                    try {
                        await fetch(config.webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                        });
                    }
                    catch (e) {
                        console.error('Webhook dispatch failed:', e);
                    }
                }
                break;
        }
    }
};
exports.AutomationsService = AutomationsService;
exports.AutomationsService = AutomationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], AutomationsService);
//# sourceMappingURL=automations.service.js.map