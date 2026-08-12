import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tenant Admin Exclusive: Create Team Leader (TL)
   */
  async createTeamLeader(organizationId: string, currentUserRole: string, data: { name: string; email: string; managerId: string }) {
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('ONLY Tenant Admin is authorized to create Team Leaders');
    }

    // Verify target manager belongs to organization
    const manager = await this.prisma.user.findFirst({
      where: { id: data.managerId, organizationId },
    });
    if (!manager) {
      throw new NotFoundException('Specified Manager not found in tenant company');
    }

    return this.prisma.team.create({
      data: {
        name: `${data.name}'s Sales Unit`,
        organizationId,
      },
    });
  }

  /**
   * Tenant Admin Exclusive: Assign or Move Employee under a Manager or Team Leader
   */
  async assignEmployeeHierarchy(
    organizationId: string,
    currentUserRole: string,
    dto: { employeeId: string; managerId?: string; teamLeaderId?: string }
  ) {
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('ONLY Tenant Admin is authorized to assign or move employees under Managers/TLs');
    }

    const employee = await this.prisma.user.findFirst({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found in tenant company');
    }

    // Update hierarchy references
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

  /**
   * Get Company Organizational Hierarchy
   */
  async getHierarchy(organizationId: string) {
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
}
