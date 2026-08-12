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
exports.QuotationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let QuotationsService = class QuotationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId, opts) {
        const { status, leadId, page = 1, limit = 20 } = opts;
        const where = {
            organizationId,
            ...(status && { status }),
            ...(leadId && { leadId }),
        };
        const [total, items] = await Promise.all([
            this.prisma.quotation.count({ where }),
            this.prisma.quotation.findMany({
                where,
                include: {
                    lead: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { total, page, limit, items };
    }
    async findOne(organizationId, id) {
        const quote = await this.prisma.quotation.findFirst({
            where: { id, organizationId },
            include: {
                lead: true,
                items: { include: { product: true } },
            },
        });
        if (!quote)
            throw new common_1.NotFoundException('Quotation not found');
        return quote;
    }
    async create(organizationId, createdById, dto) {
        const subtotal = dto.lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
        const taxTotal = (subtotal * (dto.taxRate ?? 18)) / 100;
        let discountTotal = 0;
        if (dto.discountValue) {
            discountTotal = dto.discountType === 'PERCENT'
                ? (subtotal * dto.discountValue) / 100
                : dto.discountValue;
        }
        const grandTotal = subtotal + taxTotal - discountTotal;
        const count = await this.prisma.quotation.count({ where: { organizationId } });
        const number = `Q-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
        return this.prisma.quotation.create({
            data: {
                organizationId,
                number,
                leadId: dto.leadId,
                validUntil: dto.validUntil,
                discountTotal,
                taxTotal,
                subtotal,
                grandTotal,
                notes: dto.notes,
                status: 'DRAFT',
                items: {
                    create: dto.lineItems.map(li => ({
                        productId: li.productId,
                        name: li.name || li.description || 'Item',
                        description: li.description,
                        quantity: li.qty,
                        unitPrice: li.unitPrice,
                        taxRate: li.taxRate ?? dto.taxRate ?? 18,
                        total: li.qty * li.unitPrice,
                    })),
                },
            },
            include: { items: true },
        });
    }
    async updateStatus(organizationId, id, status) {
        const quote = await this.prisma.quotation.findFirst({ where: { id, organizationId } });
        if (!quote)
            throw new common_1.NotFoundException('Quotation not found');
        return this.prisma.quotation.update({
            where: { id },
            data: { status },
        });
    }
    async delete(organizationId, id) {
        const quote = await this.prisma.quotation.findFirst({ where: { id, organizationId } });
        if (!quote)
            throw new common_1.NotFoundException('Quotation not found');
        await this.prisma.quotation.delete({ where: { id } });
        return { success: true };
    }
};
exports.QuotationsService = QuotationsService;
exports.QuotationsService = QuotationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuotationsService);
//# sourceMappingURL=quotations.service.js.map