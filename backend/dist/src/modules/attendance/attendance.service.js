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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AttendanceService = class AttendanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkIn(organizationId, userId) {
        const profile = await this.prisma.employeeProfile.findUnique({ where: { userId } });
        if (!profile?.canSelfCheckIn) {
            throw new common_1.BadRequestException('Self check-in is not enabled for your account. Please contact HR.');
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await this.prisma.employeeAttendance.findUnique({
            where: { organizationId_userId_date: { organizationId, userId, date: today } },
        });
        if (existing?.checkIn)
            throw new common_1.BadRequestException('Already checked in today');
        const now = new Date();
        return this.prisma.employeeAttendance.upsert({
            where: { organizationId_userId_date: { organizationId, userId, date: today } },
            create: {
                organizationId, userId,
                date: today,
                checkIn: now,
                status: 'PRESENT',
                isManualEntry: false,
            },
            update: { checkIn: now, status: 'PRESENT' },
        });
    }
    async checkOut(organizationId, userId) {
        const profile = await this.prisma.employeeProfile.findUnique({ where: { userId } });
        if (!profile?.canSelfCheckIn) {
            throw new common_1.BadRequestException('Self check-out is not enabled for your account.');
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const record = await this.prisma.employeeAttendance.findUnique({
            where: { organizationId_userId_date: { organizationId, userId, date: today } },
        });
        if (!record?.checkIn)
            throw new common_1.BadRequestException('No check-in found for today');
        if (record.checkOut)
            throw new common_1.BadRequestException('Already checked out today');
        const now = new Date();
        const workingHours = (now.getTime() - record.checkIn.getTime()) / 3600000;
        const status = workingHours >= 4 && workingHours < 6 ? 'HALF_DAY' : workingHours >= 6 ? 'PRESENT' : 'HALF_DAY';
        return this.prisma.employeeAttendance.update({
            where: { id: record.id },
            data: { checkOut: now, workingHours, status },
        });
    }
    async getMyAttendance(userId, month, year) {
        const now = new Date();
        const m = month ?? now.getMonth() + 1;
        const y = year ?? now.getFullYear();
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 0);
        return this.prisma.employeeAttendance.findMany({
            where: { userId, date: { gte: startDate, lte: endDate } },
            orderBy: { date: 'asc' },
        });
    }
    async getTeamAttendance(organizationId, teamLeaderId, month, year) {
        const members = await this.prisma.user.findMany({
            where: { organizationId },
            select: { id: true, firstName: true, lastName: true },
        });
        const memberIds = members.map((m) => m.id);
        const now = new Date();
        const mo = month ?? now.getMonth() + 1;
        const yr = year ?? now.getFullYear();
        const startDate = new Date(yr, mo - 1, 1);
        const endDate = new Date(yr, mo, 0);
        const attendance = await this.prisma.employeeAttendance.findMany({
            where: { organizationId, userId: { in: memberIds }, date: { gte: startDate, lte: endDate } },
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: [{ date: 'desc' }, { userId: 'asc' }],
        });
        return { members, attendance };
    }
    async getAllAttendance(organizationId, month, year, userId) {
        const now = new Date();
        const mo = month ?? now.getMonth() + 1;
        const yr = year ?? now.getFullYear();
        const startDate = new Date(yr, mo - 1, 1);
        const endDate = new Date(yr, mo, 0);
        return this.prisma.employeeAttendance.findMany({
            where: {
                organizationId,
                date: { gte: startDate, lte: endDate },
                ...(userId && { userId }),
            },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
            orderBy: [{ date: 'desc' }, { userId: 'asc' }],
        });
    }
    async manualMark(organizationId, markedById, dto) {
        const date = new Date(dto.date);
        date.setHours(0, 0, 0, 0);
        let workingHours = 0;
        if (dto.checkIn && dto.checkOut) {
            workingHours = (new Date(dto.checkOut).getTime() - new Date(dto.checkIn).getTime()) / 3600000;
        }
        return this.prisma.employeeAttendance.upsert({
            where: { organizationId_userId_date: { organizationId, userId: dto.userId, date } },
            create: {
                organizationId, userId: dto.userId, date,
                status: dto.status,
                checkIn: dto.checkIn ?? null,
                checkOut: dto.checkOut ?? null,
                workingHours,
                isManualEntry: true,
                markedById,
                notes: dto.notes,
            },
            update: {
                status: dto.status,
                checkIn: dto.checkIn ?? null,
                checkOut: dto.checkOut ?? null,
                workingHours,
                isManualEntry: true,
                markedById,
                notes: dto.notes,
            },
        });
    }
    async getSummary(organizationId, userId, month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const records = await this.prisma.employeeAttendance.findMany({
            where: { organizationId, userId, date: { gte: startDate, lte: endDate } },
        });
        const summary = {
            present: records.filter((r) => r.status === 'PRESENT').length,
            absent: records.filter((r) => r.status === 'ABSENT').length,
            halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
            onLeave: records.filter((r) => r.status === 'ON_LEAVE').length,
            workFromHome: records.filter((r) => r.status === 'WORK_FROM_HOME').length,
            holiday: records.filter((r) => r.status === 'HOLIDAY').length,
            late: records.filter((r) => r.status === 'LATE').length,
            totalWorkingHours: records.reduce((s, r) => s + Number(r.workingHours), 0),
            records,
        };
        return summary;
    }
    async toggleSelfCheckIn(organizationId, userId, enabled) {
        const profile = await this.prisma.employeeProfile.findFirst({
            where: { organizationId, userId },
        });
        if (!profile)
            throw new common_1.NotFoundException('Employee profile not found');
        return this.prisma.employeeProfile.update({
            where: { id: profile.id },
            data: { canSelfCheckIn: enabled },
        });
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map