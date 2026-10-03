import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeaveRequestStatus, LeaveType } from '@prisma/client';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  /** Downstream Team Traversal Helper for Managers and TLs */
  private async getDownstreamUserIds(organizationId: string, managerId: string): Promise<Set<string>> {
    const allUsers = await this.prisma.user.findMany({
      where: { organizationId },
      select: { id: true, managerId: true },
    });
    const downstreamIds = new Set<string>();
    downstreamIds.add(managerId);
    let added = true;
    while (added) {
      added = false;
      for (const u of allUsers) {
        if (u.managerId && downstreamIds.has(u.managerId) && !downstreamIds.has(u.id)) {
          downstreamIds.add(u.id);
          added = true;
        }
      }
    }
    return downstreamIds;
  }

  /** Apply for a new leave request */
  async applyLeave(
    organizationId: string,
    userId: string,
    dto: {
      leaveType: string;
      startDate: string;
      endDate: string;
      reason?: string;
    },
  ) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end date');
    }
    if (end < start) {
      throw new BadRequestException('End date cannot be earlier than start date');
    }

    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const validLeaveType = (Object.values(LeaveType).includes(dto.leaveType as any)
      ? dto.leaveType
      : LeaveType.CASUAL) as LeaveType;

    return this.prisma.leaveRequest.create({
      data: {
        organizationId,
        userId,
        leaveType: validLeaveType,
        startDate: start,
        endDate: end,
        totalDays: diffDays,
        reason: dto.reason || '',
        status: LeaveRequestStatus.PENDING,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  /**
   * Get leave requests based on role (Decision B2):
   * - HR & Admin: Company-wide
   * - Manager & TL: Own team downstream
   * - Employee: Self only
   */
  async getLeaveRequests(
    organizationId: string,
    user: any,
    query?: { status?: string; userId?: string },
  ) {
    const roleName = typeof user.role === 'string' ? user.role : user.role?.name || '';
    const isCompanyWide = ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'HR'].includes(roleName);
    const isManager = ['MANAGER', 'DEPT_MANAGER', 'TL', 'TEAM_LEAD', 'TEAM_LEADER'].includes(roleName);

    let userFilter: any = undefined;

    if (query?.userId) {
      userFilter = query.userId;
    } else if (isCompanyWide) {
      // HR and Admin can see all requests
      userFilter = undefined;
    } else if (isManager) {
      const downstreamIds = await this.getDownstreamUserIds(organizationId, user.id);
      userFilter = { in: Array.from(downstreamIds) };
    } else {
      userFilter = user.id;
    }

    const where: any = {
      organizationId,
      ...(userFilter !== undefined && { userId: userFilter }),
      ...(query?.status && { status: query.status as any }),
    };

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approve leave request (Decision B2):
   * - Managers approve own team leaves
   * - HR handles company-wide
   */
  async approveLeave(organizationId: string, approverUser: any, requestId: string) {
    const roleName = typeof approverUser.role === 'string' ? approverUser.role : approverUser.role?.name || '';
    const isCompanyWide = ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'HR'].includes(roleName);
    const isManager = ['MANAGER', 'DEPT_MANAGER', 'TL', 'TEAM_LEAD', 'TEAM_LEADER'].includes(roleName);

    if (!isCompanyWide && !isManager) {
      throw new ForbiddenException('⛔ Access Denied: You do not have permission to approve leaves.');
    }

    const request = await this.prisma.leaveRequest.findFirst({
      where: { id: requestId, organizationId },
    });
    if (!request) throw new NotFoundException('Leave request not found');

    if (!isCompanyWide) {
      const downstreamIds = await this.getDownstreamUserIds(organizationId, approverUser.id);
      if (!downstreamIds.has(request.userId)) {
        throw new ForbiddenException('⛔ Managers can only approve leaves for members of their own team.');
      }
    }

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: LeaveRequestStatus.APPROVED,
        approvedById: approverUser.id,
        approvedAt: new Date(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Reject leave request (Decision B2):
   * - Managers reject own team leaves
   * - HR handles company-wide
   */
  async rejectLeave(
    organizationId: string,
    approverUser: any,
    requestId: string,
    rejectionNote?: string,
  ) {
    const roleName = typeof approverUser.role === 'string' ? approverUser.role : approverUser.role?.name || '';
    const isCompanyWide = ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'HR'].includes(roleName);
    const isManager = ['MANAGER', 'DEPT_MANAGER', 'TL', 'TEAM_LEAD', 'TEAM_LEADER'].includes(roleName);

    if (!isCompanyWide && !isManager) {
      throw new ForbiddenException('⛔ Access Denied: You do not have permission to reject leaves.');
    }

    const request = await this.prisma.leaveRequest.findFirst({
      where: { id: requestId, organizationId },
    });
    if (!request) throw new NotFoundException('Leave request not found');

    if (!isCompanyWide) {
      const downstreamIds = await this.getDownstreamUserIds(organizationId, approverUser.id);
      if (!downstreamIds.has(request.userId)) {
        throw new ForbiddenException('⛔ Managers can only reject leaves for members of their own team.');
      }
    }

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: LeaveRequestStatus.REJECTED,
        approvedById: approverUser.id,
        approvedAt: new Date(),
        rejectionNote: rejectionNote || 'Leave request declined.',
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /** Cancel own pending leave request */
  async cancelLeave(organizationId: string, userId: string, requestId: string) {
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id: requestId, organizationId, userId },
    });
    if (!request) throw new NotFoundException('Leave request not found or not owned by you');
    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('Only pending leave requests can be cancelled');
    }

    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: LeaveRequestStatus.CANCELLED },
    });
  }

  /** Get leave balances and policies */
  async getLeaveBalances(organizationId: string, userId: string, year?: number) {
    const currentYear = year || new Date().getFullYear();
    const [policies, balances] = await Promise.all([
      this.prisma.leavePolicy.findMany({
        where: { organizationId, isActive: true },
      }),
      this.prisma.leaveBalance.findMany({
        where: { organizationId, userId, year: currentYear },
        include: { policy: true },
      }),
    ]);

    return { policies, balances, year: currentYear };
  }
}
