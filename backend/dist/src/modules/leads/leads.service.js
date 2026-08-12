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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let LeadsService = class LeadsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId, query) {
        const { page = 1, limit = 20, search, statusId, ownerId, sourceId, sortBy = 'createdAt', sortOrder = 'desc' } = query;
        const skip = (page - 1) * limit;
        const where = {
            organizationId,
            ...(statusId && { statusId }),
            ...(ownerId && { ownerId }),
            ...(sourceId && { sourceId }),
            ...(search && {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [leads, total] = await Promise.all([
            this.prisma.lead.findMany({
                where,
                include: {
                    status: true,
                    owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                    source: true,
                    company: { select: { id: true, name: true } },
                    _count: { select: { tasks: true, activities: true } },
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            this.prisma.lead.count({ where }),
        ]);
        return {
            data: leads,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(organizationId, id) {
        const lead = await this.prisma.lead.findFirst({
            where: { id, organizationId },
            include: {
                status: true,
                owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
                team: true,
                source: true,
                company: true,
                deals: { include: { stage: true, pipeline: true } },
                tasks: { orderBy: { dueAt: 'asc' } },
                meetings: { orderBy: { startAt: 'asc' } },
                statusHistory: { include: { status: true }, orderBy: { changedAt: 'desc' }, take: 20 },
                activities: {
                    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
                noteEntries: { orderBy: { createdAt: 'desc' } },
                quotations: { orderBy: { createdAt: 'desc' } },
            },
        });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        return lead;
    }
    async create(organizationId, createdById, dto) {
        const lead = await this.prisma.lead.create({
            data: {
                organizationId,
                createdById,
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                statusId: dto.statusId,
                ownerId: dto.ownerId ?? createdById,
                sourceId: dto.sourceId,
                companyId: dto.companyId,
                customFields: dto.customFields ?? {},
                tags: dto.tags ?? [],
                notes: dto.notes,
            },
            include: { status: true, owner: { select: { id: true, firstName: true, lastName: true } } },
        });
        await this.prisma.activity.create({
            data: {
                organizationId,
                type: 'SYSTEM',
                leadId: lead.id,
                userId: createdById,
                description: 'Lead created',
            },
        });
        return lead;
    }
    async update(organizationId, userId, id, dto) {
        const existing = await this.prisma.lead.findFirst({ where: { id, organizationId } });
        if (!existing)
            throw new common_1.NotFoundException('Lead not found');
        const lead = await this.prisma.lead.update({
            where: { id },
            data: {
                ...(dto.firstName && { firstName: dto.firstName }),
                ...(dto.lastName && { lastName: dto.lastName }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
                ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
                ...(dto.companyId !== undefined && { companyId: dto.companyId }),
                ...(dto.sourceId !== undefined && { sourceId: dto.sourceId }),
                ...(dto.customFields && { customFields: dto.customFields }),
                ...(dto.tags && { tags: dto.tags }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
                lastActivityAt: new Date(),
            },
        });
        return lead;
    }
    async changeStatus(organizationId, userId, id, statusId, notes) {
        const lead = await this.prisma.lead.findFirst({ where: { id, organizationId } });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        const status = await this.prisma.leadStatus.findFirst({ where: { id: statusId, organizationId } });
        if (!status)
            throw new common_1.NotFoundException('Status not found');
        await this.prisma.$transaction([
            this.prisma.lead.update({
                where: { id },
                data: { statusId, lastActivityAt: new Date() },
            }),
            this.prisma.leadStatusHistory.create({
                data: { leadId: id, statusId, changedById: userId, notes },
            }),
            this.prisma.activity.create({
                data: {
                    organizationId,
                    type: 'STATUS_CHANGE',
                    leadId: id,
                    userId,
                    description: `Status changed to "${status.name}"`,
                    metadata: { fromStatusId: lead.statusId, toStatusId: statusId },
                },
            }),
        ]);
        return this.findOne(organizationId, id);
    }
    async remove(organizationId, id) {
        const existing = await this.prisma.lead.findFirst({ where: { id, organizationId } });
        if (!existing)
            throw new common_1.NotFoundException('Lead not found');
        await this.prisma.lead.delete({ where: { id } });
        return { message: 'Lead deleted' };
    }
    async getTimeline(organizationId, id) {
        const lead = await this.prisma.lead.findFirst({ where: { id, organizationId } });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        return this.prisma.activity.findMany({
            where: { organizationId, leadId: id },
            include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map