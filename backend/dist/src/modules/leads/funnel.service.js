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
exports.LeadFunnelService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let LeadFunnelService = class LeadFunnelService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async allocateBatchQuota(organizationId, managerId, startRange, endRange) {
        const limit = Math.max(1, endRange - startRange + 1);
        const skip = Math.max(0, startRange - 1);
        const unassignedLeads = await this.prisma.lead.findMany({
            where: { organizationId, ownerId: null },
            orderBy: { createdAt: 'asc' },
            skip,
            take: limit,
            select: { id: true },
        });
        if (unassignedLeads.length === 0) {
            return { message: 'No unassigned leads found in specified range', allocatedCount: 0 };
        }
        const leadIds = unassignedLeads.map(l => l.id);
        await this.prisma.lead.updateMany({
            where: { id: { in: leadIds }, organizationId },
            data: { ownerId: managerId },
        });
        return {
            message: `Successfully allocated ${leadIds.length} leads to Manager ${managerId}`,
            allocatedCount: leadIds.length,
            leadIds,
        };
    }
    async claimDynamicLead(organizationId, userId, leadId) {
        return this.prisma.$transaction(async (tx) => {
            const lead = await tx.lead.findUnique({
                where: { id: leadId },
                select: { id: true, organizationId: true, ownerId: true },
            });
            if (!lead || lead.organizationId !== organizationId) {
                throw new common_1.NotFoundException('Lead not found in tenant pool');
            }
            if (lead.ownerId !== null) {
                throw new common_1.BadRequestException('Lead has already been claimed and vanished from open pool');
            }
            const updated = await tx.lead.update({
                where: { id: leadId },
                data: {
                    ownerId: userId,
                },
            });
            return {
                success: true,
                message: `Lead ${lead.id} acquired successfully. Vanished from open pool.`,
                lead: updated,
            };
        });
    }
    async directAdminFunnel(organizationId, leadIds, managerId) {
        const res = await this.prisma.lead.updateMany({
            where: {
                id: { in: leadIds },
                organizationId,
            },
            data: { ownerId: managerId },
        });
        return {
            message: `Direct Admin Funnel: Allocated ${res.count} leads to Manager`,
            count: res.count,
        };
    }
};
exports.LeadFunnelService = LeadFunnelService;
exports.LeadFunnelService = LeadFunnelService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadFunnelService);
//# sourceMappingURL=funnel.service.js.map