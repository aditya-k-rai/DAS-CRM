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
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let TeamsService = class TeamsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTeamLeader(organizationId, currentUserRole, data) {
        if (currentUserRole !== 'ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('ONLY Tenant Admin is authorized to create Team Leaders');
        }
        const manager = await this.prisma.user.findFirst({
            where: { id: data.managerId, organizationId },
        });
        if (!manager) {
            throw new common_1.NotFoundException('Specified Manager not found in tenant company');
        }
        return this.prisma.team.create({
            data: {
                name: `${data.name}'s Sales Unit`,
                organizationId,
            },
        });
    }
    async assignEmployeeHierarchy(organizationId, currentUserRole, dto) {
        if (currentUserRole !== 'ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('ONLY Tenant Admin is authorized to assign or move employees under Managers/TLs');
        }
        const employee = await this.prisma.user.findFirst({
            where: { id: dto.employeeId, organizationId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found in tenant company');
        }
        return {
            success: true,
            message: `Employee ${employee.firstName || employee.id} assigned successfully by Tenant Admin`,
            hierarchy: {
                employeeId: dto.employeeId,
                managerId: dto.managerId || null,
                teamLeaderId: dto.teamLeaderId || null,
            },
        };
    }
    async getHierarchy(organizationId) {
        const users = await this.prisma.user.findMany({
            where: { organizationId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
            },
        });
        return {
            organizationId,
            totalUsers: users.length,
            users,
        };
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map