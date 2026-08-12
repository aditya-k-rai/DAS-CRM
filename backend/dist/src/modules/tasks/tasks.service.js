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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let TasksService = class TasksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId, userId, opts) {
        const { assignedToMe, status, dueDate, page = 1, limit = 30 } = opts;
        const now = new Date();
        const where = {
            organizationId,
            ...(assignedToMe && { assigneeId: userId }),
            ...(status === 'OVERDUE'
                ? { isCompleted: false, dueAt: { lt: now } }
                : status === 'COMPLETED'
                    ? { isCompleted: true }
                    : status === 'PENDING'
                        ? { isCompleted: false }
                        : {}),
            ...(dueDate && { dueAt: { gte: new Date(dueDate.setHours(0, 0, 0)), lte: new Date(dueDate.setHours(23, 59, 59)) } }),
        };
        const [total, items] = await Promise.all([
            this.prisma.task.count({ where }),
            this.prisma.task.findMany({
                where,
                include: {
                    assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                    lead: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: [{ dueAt: 'asc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { total, page, limit, items };
    }
    async create(organizationId, creatorId, dto) {
        return this.prisma.task.create({
            data: {
                organizationId,
                createdById: creatorId,
                title: dto.title,
                description: dto.description,
                dueAt: dto.dueDate,
                assigneeId: dto.assigneeId ?? creatorId,
                leadId: dto.leadId,
                contactId: dto.contactId,
                dealId: dto.dealId,
            },
            include: {
                assignee: { select: { id: true, firstName: true, lastName: true } },
                lead: { select: { id: true, firstName: true, lastName: true } },
            },
        });
    }
    async complete(organizationId, id, userId) {
        const task = await this.prisma.task.findFirst({ where: { id, organizationId } });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return this.prisma.task.update({
            where: { id },
            data: { isCompleted: true, completedAt: new Date() },
        });
    }
    async update(organizationId, id, dto) {
        const task = await this.prisma.task.findFirst({ where: { id, organizationId } });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        return this.prisma.task.update({ where: { id }, data: dto });
    }
    async delete(organizationId, id) {
        const task = await this.prisma.task.findFirst({ where: { id, organizationId } });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        await this.prisma.task.delete({ where: { id } });
        return { success: true };
    }
    async getOverdueCount(organizationId) {
        return this.prisma.task.count({
            where: { organizationId, isCompleted: false, dueAt: { lt: new Date() } },
        });
    }
    async getTodayTasks(organizationId, userId) {
        const today = new Date();
        const start = new Date(today.setHours(0, 0, 0, 0));
        const end = new Date(today.setHours(23, 59, 59, 999));
        return this.prisma.task.findMany({
            where: { organizationId, assigneeId: userId, dueAt: { gte: start, lte: end } },
            include: { lead: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { dueAt: 'asc' },
        });
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map