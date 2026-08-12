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
exports.DealsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let DealsService = class DealsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPipelines(organizationId) {
        return this.prisma.pipeline.findMany({
            where: { organizationId },
            include: {
                stages: { orderBy: { order: 'asc' } },
            },
            orderBy: { isDefault: 'desc' },
        });
    }
    async getDeals(organizationId, opts) {
        const { pipelineId, stageId, assignedTo, search, page = 1, limit = 50 } = opts;
        const where = {
            organizationId,
            ...(pipelineId && { pipelineId }),
            ...(stageId && { stageId }),
            ...(assignedTo && { ownerId: assignedTo }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [total, items] = await Promise.all([
            this.prisma.deal.count({ where }),
            this.prisma.deal.findMany({
                where,
                include: {
                    stage: { select: { id: true, name: true, probability: true } },
                    pipeline: { select: { id: true, name: true } },
                    owner: { select: { id: true, firstName: true, lastName: true } },
                    company: { select: { id: true, name: true } },
                    lead: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { total, page, limit, items };
    }
    async createDeal(organizationId, dto) {
        return this.prisma.deal.create({
            data: {
                organizationId,
                title: dto.title,
                pipelineId: dto.pipelineId,
                stageId: dto.stageId,
                leadId: dto.leadId,
                companyId: dto.companyId,
                ownerId: dto.ownerId ?? dto.assignedToId,
                value: dto.value ?? 0,
                expectedCloseAt: dto.expectedCloseAt ?? dto.expectedCloseDate,
                notes: dto.notes ? { create: { organizationId, content: dto.notes } } : undefined,
            },
            include: { stage: true, pipeline: true },
        });
    }
    async moveDeal(organizationId, dealId, stageId) {
        const deal = await this.prisma.deal.findFirst({ where: { id: dealId, organizationId } });
        if (!deal)
            throw new common_1.NotFoundException('Deal not found');
        const stage = await this.prisma.stage.findFirst({ where: { id: stageId } });
        if (!stage)
            throw new common_1.NotFoundException('Stage not found');
        const isWon = stage.name.toLowerCase().includes('won');
        const isLost = stage.name.toLowerCase().includes('lost');
        return this.prisma.deal.update({
            where: { id: dealId },
            data: {
                stageId,
                status: isWon ? client_1.DealStatus.WON : isLost ? client_1.DealStatus.LOST : client_1.DealStatus.OPEN,
                closedAt: (isWon || isLost) ? new Date() : null,
            },
        });
    }
    async updateDeal(organizationId, id, dto) {
        const deal = await this.prisma.deal.findFirst({ where: { id, organizationId } });
        if (!deal)
            throw new common_1.NotFoundException('Deal not found');
        return this.prisma.deal.update({ where: { id }, data: dto });
    }
    async deleteDeal(organizationId, id) {
        const deal = await this.prisma.deal.findFirst({ where: { id, organizationId } });
        if (!deal)
            throw new common_1.NotFoundException('Deal not found');
        await this.prisma.deal.delete({ where: { id } });
        return { success: true };
    }
    async getForecast(organizationId) {
        const deals = await this.prisma.deal.findMany({
            where: { organizationId, status: client_1.DealStatus.OPEN },
            include: { stage: true },
        });
        const totalPipeline = deals.reduce((s, d) => s + Number(d.value), 0);
        const weightedValue = deals.reduce((s, d) => s + (Number(d.value) * ((d.stage?.probability ?? 0) / 100)), 0);
        const byStage = deals.reduce((acc, d) => {
            const key = d.stage?.name ?? 'Unknown';
            const prob = d.stage?.probability ?? 0;
            if (!acc[key])
                acc[key] = { count: 0, value: 0, weighted: 0 };
            acc[key].count++;
            acc[key].value += Number(d.value);
            acc[key].weighted += Number(d.value) * (prob / 100);
            return acc;
        }, {});
        return { totalPipeline, weightedValue, byStage, dealsCount: deals.length };
    }
};
exports.DealsService = DealsService;
exports.DealsService = DealsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DealsService);
//# sourceMappingURL=deals.service.js.map