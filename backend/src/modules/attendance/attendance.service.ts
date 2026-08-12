import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(organizationId: string, userId: string) {
    // Check if employee can self-check-in
    const profile = await this.prisma.employeeProfile.findUnique({
      where: { userId },
    });
    if (!profile?.canSelfCheckIn) {
      throw new BadRequestException(
        'Self check-in is not enabled for your account. Please contact HR.',
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.employeeAttendance.findUnique({
      where: {
        organizationId_userId_date: { organizationId, userId, date: today },
      },
    });

    if (existing?.checkIn)
      throw new BadRequestException('Already checked in today');

    const now = new Date();
    return this.prisma.employeeAttendance.upsert({
      where: {
        organizationId_userId_date: { organizationId, userId, date: today },
      },
      create: {
        organizationId,
        userId,
        date: today,
        checkIn: now,
        status: 'PRESENT',
        isManualEntry: false,
      },
      update: { checkIn: now, status: 'PRESENT' },
    });
  }

  async checkOut(organizationId: string, userId: string) {
    const profile = await this.prisma.employeeProfile.findUnique({
      where: { userId },
    });
    if (!profile?.canSelfCheckIn) {
      throw new BadRequestException(
        'Self check-out is not enabled for your account.',
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await this.prisma.employeeAttendance.findUnique({
      where: {
        organizationId_userId_date: { organizationId, userId, date: today },
      },
    });
    if (!record?.checkIn)
      throw new BadRequestException('No check-in found for today');
    if (record.checkOut)
      throw new BadRequestException('Already checked out today');

    const now = new Date();
    const workingHours = (now.getTime() - record.checkIn.getTime()) / 3600000;
    const status =
      workingHours >= 4 && workingHours < 6
        ? 'HALF_DAY'
        : workingHours >= 6
          ? 'PRESENT'
          : 'HALF_DAY';

    return this.prisma.employeeAttendance.update({
      where: { id: record.id },
      data: { checkOut: now, workingHours, status },
    });
  }

  async getMyAttendance(userId: string, month?: number, year?: number) {
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

  async getTeamAttendance(
    organizationId: string,
    teamLeaderId: string,
    month?: number,
    year?: number,
  ) {
    // Get all team members in the organization
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
      where: {
        organizationId,
        userId: { in: memberIds },
        date: { gte: startDate, lte: endDate },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ date: 'desc' }, { userId: 'asc' }],
    });

    return { members, attendance };
  }

  async getAllAttendance(
    organizationId: string,
    month?: number,
    year?: number,
    userId?: string,
  ) {
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
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { userId: 'asc' }],
    });
  }

  async manualMark(
    organizationId: string,
    markedById: string,
    dto: {
      userId: string;
      date: Date;
      status: string;
      checkIn?: Date;
      checkOut?: Date;
      notes?: string;
    },
  ) {
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    let workingHours = 0;
    if (dto.checkIn && dto.checkOut) {
      workingHours =
        (new Date(dto.checkOut).getTime() - new Date(dto.checkIn).getTime()) /
        3600000;
    }

    return this.prisma.employeeAttendance.upsert({
      where: {
        organizationId_userId_date: {
          organizationId,
          userId: dto.userId,
          date,
        },
      },
      create: {
        organizationId,
        userId: dto.userId,
        date,
        status: dto.status as any,
        checkIn: dto.checkIn ?? null,
        checkOut: dto.checkOut ?? null,
        workingHours,
        isManualEntry: true,
        markedById,
        notes: dto.notes,
      },
      update: {
        status: dto.status as any,
        checkIn: dto.checkIn ?? null,
        checkOut: dto.checkOut ?? null,
        workingHours,
        isManualEntry: true,
        markedById,
        notes: dto.notes,
      },
    });
  }

  async getSummary(
    organizationId: string,
    userId: string,
    month: number,
    year: number,
  ) {
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
      totalWorkingHours: records.reduce(
        (s, r) => s + Number(r.workingHours),
        0,
      ),
      records,
    };

    return summary;
  }

  async toggleSelfCheckIn(
    organizationId: string,
    userId: string,
    enabled: boolean,
  ) {
    const profile = await this.prisma.employeeProfile.findFirst({
      where: { organizationId, userId },
    });
    if (!profile) throw new NotFoundException('Employee profile not found');
    return this.prisma.employeeProfile.update({
      where: { id: profile.id },
      data: { canSelfCheckIn: enabled },
    });
  }
}
