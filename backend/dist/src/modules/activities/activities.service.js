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
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ActivitiesService = class ActivitiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(organizationId, userId, dto) {
        const typeEnum = (Object.values(client_1.ActivityType).includes(dto.activityType)
            ? dto.activityType
            : 'NOTE');
        return this.prisma.activity.create({
            data: {
                organizationId,
                userId,
                type: typeEnum,
                leadId: dto.leadId,
                contactId: dto.contactId,
                dealId: dto.dealId,
                description: dto.notes,
                metadata: {
                    subject: dto.subject,
                    durationMin: dto.durationMin,
                    outcome: dto.outcome,
                    nextAction: dto.nextAction,
                    nextActionDate: dto.nextActionDate,
                },
            },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
        });
    }
    async getTimeline(organizationId, opts) {
        const { leadId, contactId, dealId, page = 1, limit = 20 } = opts;
        const where = {
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
                    user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { total, page, limit, items };
    }
    async getUserActivity(organizationId, userId, days = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const activities = await this.prisma.activity.findMany({
            where: { organizationId, userId, createdAt: { gte: since } },
            orderBy: { createdAt: 'desc' },
        });
        const byType = activities.reduce((acc, a) => {
            acc[a.type] = (acc[a.type] ?? 0) + 1;
            return acc;
        }, {});
        return { activities, byType, total: activities.length };
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map