import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tenant Admin Exclusive: Create Team Leader (TL) or Sales Unit
   */
  async createTeamLeader(
    organizationId: string,
    currentUserRole: string,
    data: { name: string; email?: string; managerId?: string },
  ) {
    if (!['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(currentUserRole)) {
      throw new ForbiddenException(
        'ONLY Tenant Admin is authorized to create Team Leaders or Teams',
      );
    }

    if (data.managerId) {
      const manager = await this.prisma.user.findFirst({
        where: { id: data.managerId, organizationId },
      });
      if (!manager) {
        throw new NotFoundException('Specified Manager not found in tenant company');
      }
    }

    return this.prisma.team.create({
      data: {
        name: data.name.includes('Team') ? data.name : `${data.name}'s Sales Unit`,
        organizationId,
      },
    });
  }

  /**
   * Tenant Admin Exclusive: Assign or Move Employee under a Manager or Team Leader
   * Supports Hybrid Hierarchy (Decision C1):
   * Employees can report directly to Managers or through TLs.
   */
  async assignEmployeeHierarchy(
    organizationId: string,
    currentUserRole: string,
    dto: { employeeId: string; managerId?: string; teamLeaderId?: string },
  ) {
    if (!['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(currentUserRole)) {
      throw new ForbiddenException(
        'ONLY Tenant Admin is authorized to assign or modify reporting hierarchy',
      );
    }

    const employee = await this.prisma.user.findFirst({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found in tenant company');
    }

    const targetManagerId = dto.managerId || dto.teamLeaderId || null;

    if (targetManagerId) {
      if (targetManagerId === dto.employeeId) {
        throw new BadRequestException('An employee cannot report to themselves');
      }
      const targetManager = await this.prisma.user.findFirst({
        where: { id: targetManagerId, organizationId },
      });
      if (!targetManager) {
        throw new NotFoundException('Target manager/TL not found in tenant company');
      }
    }

    // Persist hierarchy reference to database
    await this.prisma.user.update({
      where: { id: dto.employeeId },
      data: { managerId: targetManagerId },
    });

    return {
      success: true,
      message: `Employee ${employee.firstName || employee.id} hierarchy updated successfully`,
      hierarchy: {
        employeeId: dto.employeeId,
        managerId: targetManagerId,
      },
    };
  }

  /**
   * Get Company Organizational Hierarchy (Decision C1 & C2)
   */
  async getHierarchy(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        role: true,
        managerId: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      organizationId,
      totalUsers: users.length,
      users,
    };
  }
}
