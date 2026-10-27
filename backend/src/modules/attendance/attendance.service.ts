import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record punch in/out with comprehensive database persistence,
   * working hours computation, geo-tagging, and selfie metadata.
   */
  async recordPunch(
    organizationId: string,
    userId: string,
    body: { type: 'IN' | 'OUT'; location?: string; image?: string; notes?: string },
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();
    const isOut = body.type === 'OUT';

    const existing = await this.prisma.employeeAttendance.findUnique({
      where: {
        organizationId_userId_date: { organizationId, userId, date: today },
      },
    });

    let meta: any = {};
    if (existing?.notes) {
      try {
        meta = JSON.parse(existing.notes);
      } catch {
        meta = { originalNotes: existing.notes };
      }
    }

    if (body.location) {
      if (isOut) meta.outLocation = body.location;
      else meta.inLocation = body.location;
    }
    if (body.image) {
      if (isOut) meta.outImage = body.image;
      else meta.selfieUrl = body.image;
    }
    if (body.notes) {
      meta.userNote = body.notes;
    }

    const updatedNotes = JSON.stringify(meta);

    if (isOut) {
      const checkInTime = existing?.checkIn || now;
      const diffMs = Math.max(0, now.getTime() - checkInTime.getTime());
      const workingHours = Math.round((diffMs / 3600000) * 100) / 100;
      const status =
        workingHours >= 6
          ? 'PRESENT'
          : workingHours >= 4
            ? 'HALF_DAY'
            : (existing?.status || 'PRESENT');

      return this.prisma.employeeAttendance.upsert({
        where: {
          organizationId_userId_date: { organizationId, userId, date: today },
        },
        create: {
          organizationId,
          userId,
          date: today,
          checkIn: checkInTime,
          checkOut: now,
          workingHours,
          status,
          isManualEntry: false,
          notes: updatedNotes,
        },
        update: {
          checkOut: now,
          workingHours,
          status,
          notes: updatedNotes,
        },
      });
    } else {
      // PUNCH IN
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
          notes: updatedNotes,
        },
        update: {
          checkIn: existing?.checkIn || now,
          status: 'PRESENT',
          notes: updatedNotes,
        },
      });
    }
  }

  async checkIn(organizationId: string, userId: string, location?: string, image?: string) {
    return this.recordPunch(organizationId, userId, { type: 'IN', location, image });
  }

  async checkOut(organizationId: string, userId: string, location?: string, image?: string) {
    return this.recordPunch(organizationId, userId, { type: 'OUT', location, image });
  }

  /**
   * Get today's attendance status for the user from the database.
   */
  async getTodayStatus(organizationId: string, userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await this.prisma.employeeAttendance.findUnique({
      where: {
        organizationId_userId_date: { organizationId, userId, date: today },
      },
    });

    const isCheckedIn = !!record?.checkIn;
    const isCheckedOut = !!record?.checkOut;

    let inLocation: string | null = null;
    let outLocation: string | null = null;
    let selfieUrl: string | null = null;

    if (record?.notes) {
      try {
        const meta = JSON.parse(record.notes);
        inLocation = meta.inLocation || null;
        outLocation = meta.outLocation || null;
        selfieUrl = meta.selfieUrl || meta.outImage || null;
      } catch {}
    }

    return {
      date: today.toISOString().slice(0, 10),
      punchedIn: isCheckedIn && !isCheckedOut,
      punchedOut: isCheckedOut,
      hasCheckIn: isCheckedIn,
      hasCheckOut: isCheckedOut,
      checkIn: record?.checkIn ? record.checkIn.toISOString() : null,
      checkOut: record?.checkOut ? record.checkOut.toISOString() : null,
      workingHours: record ? Number(record.workingHours) : 0,
      status: record?.status || 'NOT_MARKED',
      inLocation,
      outLocation,
      selfieUrl,
      notes: record?.notes || null,
      record,
    };
  }

  async getMyAttendance(userId: string, month?: number, year?: number) {
    const now = new Date();
    const m = month ?? now.getMonth() + 1;
    const y = year ?? now.getFullYear();
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59, 999);

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
    const endDate = new Date(yr, mo, 0, 23, 59, 59, 999);

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
    const endDate = new Date(yr, mo, 0, 23, 59, 59, 999);

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
      date: Date | string;
      status: string;
      checkIn?: Date | string;
      checkOut?: Date | string;
      notes?: string;
    },
  ) {
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);

    let status = (dto.status || 'PRESENT').toUpperCase();
    if (status === 'LEAVE') status = 'ON_LEAVE';
    if (status === 'WEEK_OFF') status = 'HOLIDAY';

    const validStatuses = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WORK_FROM_HOME', 'LATE'];
    if (!validStatuses.includes(status)) {
      status = 'PRESENT';
    }

    const cIn = dto.checkIn ? new Date(dto.checkIn) : null;
    const cOut = dto.checkOut ? new Date(dto.checkOut) : null;

    let workingHours = 0;
    if (cIn && cOut) {
      workingHours = Math.round(((cOut.getTime() - cIn.getTime()) / 3600000) * 100) / 100;
    } else if (status === 'PRESENT') {
      workingHours = 8.5;
    } else if (status === 'HALF_DAY') {
      workingHours = 4.25;
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
        status: status as any,
        checkIn: cIn,
        checkOut: cOut,
        workingHours,
        isManualEntry: true,
        markedById,
        notes: dto.notes,
      },
      update: {
        status: status as any,
        checkIn: cIn,
        checkOut: cOut,
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
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

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
