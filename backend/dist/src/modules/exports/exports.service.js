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
exports.ExportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ExportsService = class ExportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exportLeadsCSV(organizationId) {
        const leads = await this.prisma.lead.findMany({
            where: {
                organizationId,
            },
            include: {
                owner: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const headers = ['Lead ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Score', 'Assigned Rep', 'Created Date'];
        const rows = leads.map(l => [
            l.id,
            `"${(l.firstName || '').replace(/"/g, '""')}"`,
            `"${(l.lastName || '').replace(/"/g, '""')}"`,
            l.email || '',
            l.phone || '',
            l.score || 0,
            `"${l.owner ? `${l.owner.firstName} ${l.owner.lastName}` : 'Unassigned'}"`,
            l.createdAt.toISOString().split('T')[0],
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
    async exportAttendanceCSV(organizationId) {
        const attendance = await this.prisma.employeeAttendance.findMany({
            where: { organizationId },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
            orderBy: { date: 'desc' },
        });
        const headers = ['Employee Email', 'Employee Name', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status'];
        const rows = attendance.map(a => [
            a.user?.email || '',
            `"${a.user?.firstName || ''} ${a.user?.lastName || ''}"`,
            a.date.toISOString().split('T')[0],
            a.checkIn ? a.checkIn.toLocaleTimeString() : '',
            a.checkOut ? a.checkOut.toLocaleTimeString() : '',
            a.workingHours || 0,
            a.status,
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
    async exportPayrollCSV(organizationId, monthNum) {
        const records = await this.prisma.salaryRecord.findMany({
            where: { organizationId, month: monthNum },
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
        });
        const headers = ['Employee Email', 'Employee Name', 'Month', 'Gross Salary', 'Net Salary', 'Status'];
        const rows = records.map(r => [
            r.user?.email || '',
            `"${r.user?.firstName || ''} ${r.user?.lastName || ''}"`,
            r.month,
            r.grossSalary,
            r.netSalary,
            r.status,
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
};
exports.ExportsService = ExportsService;
exports.ExportsService = ExportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportsService);
//# sourceMappingURL=exports.service.js.map