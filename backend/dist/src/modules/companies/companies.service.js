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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CompaniesService = class CompaniesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId, opts) {
        const { search, industry, page = 1, limit = 20 } = opts;
        const where = {
            organizationId,
            ...(industry && { industry }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { website: { contains: search, mode: 'insensitive' } },
                    { city: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [total, items] = await Promise.all([
            this.prisma.company.count({ where }),
            this.prisma.company.findMany({
                where,
                include: {
                    contacts: { select: { id: true, firstName: true, lastName: true } },
                    leads: { select: { id: true, status: true } },
                    deals: { select: { id: true, value: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        const itemsWithPipeline = items.map(c => ({
            ...c,
            pipelineValue: c.deals.reduce((s, d) => s + Number(d.value), 0),
        }));
        return { total, page, limit, items: itemsWithPipeline };
    }
    async findOne(organizationId, id) {
        const company = await this.prisma.company.findFirst({
            where: { id, organizationId },
            include: {
                contacts: true,
                leads: { orderBy: { createdAt: 'desc' } },
                deals: { include: { stage: true } },
            },
        });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        return company;
    }
    async create(organizationId, dto) {
        return this.prisma.company.create({
            data: {
                organizationId,
                name: dto.name,
                industry: dto.industry,
                city: dto.city,
                country: dto.country ?? 'India',
                website: dto.website ?? dto.domain,
                phone: dto.phone,
                notes: dto.notes ? { create: { organizationId, content: dto.notes } } : undefined,
                customFields: dto.customFields ?? {},
            },
        });
    }
    async update(organizationId, id, dto) {
        const company = await this.prisma.company.findFirst({ where: { id, organizationId } });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        return this.prisma.company.update({ where: { id }, data: dto });
    }
    async delete(organizationId, id) {
        const company = await this.prisma.company.findFirst({ where: { id, organizationId } });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        await this.prisma.company.delete({ where: { id } });
        return { success: true };
    }
    async getStats(organizationId) {
        const [total, withDeals, industries] = await Promise.all([
            this.prisma.company.count({ where: { organizationId } }),
            this.prisma.company.count({ where: { organizationId, deals: { some: {} } } }),
            this.prisma.company.groupBy({
                by: ['industry'],
                where: { organizationId, industry: { not: null } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 5,
            }),
        ]);
        return { total, withDeals, industries };
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map