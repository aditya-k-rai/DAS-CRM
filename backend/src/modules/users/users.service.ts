import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * List all users/members in an organization, including Unassigned registrations.
   */
  async findAll(organizationId: string) {
    if (!organizationId) return [];
    const users = await this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleId: true,
        role: { select: { id: true, name: true } },
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            phone: true,
            adminEmail: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return users.map((u) => {
      const isUnassigned = !u.roleId || !u.role || u.role.name === 'UNASSIGNED';
      const roleName = isUnassigned ? 'UNASSIGNED' : (u.role?.name || 'UNASSIGNED');
      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        role: roleName,
        roleId: u.roleId,
        hasAssignedRole: !isUnassigned,
        isVerified: !isUnassigned,
        verificationStatus: isUnassigned ? 'PENDING' : 'VERIFIED',
        avatarUrl: u.avatarUrl,
        isActive: u.isActive,
        createdAt: u.createdAt,
        phone:
          (u.email === u.organization?.adminEmail ? u.organization?.phone : null) ||
          u.organization?.phone ||
          '',
      };
    });
  }

  /**
   * Verify an unassigned user and allocate their initial operational role.
   */
  async verifyAndAssignRole(
    organizationId: string,
    adminUserId: string,
    targetUserId: string,
    assignedRole: string,
  ) {
    if (!organizationId || !targetUserId) {
      throw new BadRequestException('Organization ID and Target User ID are required.');
    }

    // 1. Verify requester is Admin/Owner
    await this.assertAdminOrOwner(organizationId, adminUserId);

    // 2. Fetch target user
    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, organizationId },
      include: { role: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found in this organization workspace.');
    }

    // 3. Normalize assigned role name
    const validRoles: Record<string, string> = {
      SALES_EXEC: 'SALES_EXEC',
      SALES: 'SALES_EXEC',
      TELECALLER: 'SALES_EXEC',
      SUPPORT: 'SALES_EXEC',
      TEAM_LEADER: 'TEAM_LEADER',
      TL: 'TEAM_LEADER',
      MANAGER: 'MANAGER',
      HR: 'HR',
      ADMIN: 'ADMIN',
    };

    const cleanInput = (assignedRole || 'SALES_EXEC').trim().toUpperCase();
    const targetRoleName = validRoles[cleanInput] || 'SALES_EXEC';

    // 4. Find or create the role in the organization
    let role = await this.prisma.role.findFirst({
      where: { organizationId, name: targetRoleName },
    });

    if (!role) {
      role = await this.prisma.role.create({
        data: {
          organizationId,
          name: targetRoleName,
          recordScope:
            targetRoleName === 'ADMIN' || targetRoleName === 'HR'
              ? 'ALL'
              : targetRoleName === 'MANAGER'
              ? 'ALL'
              : targetRoleName === 'TEAM_LEADER'
              ? 'TEAM'
              : 'OWN',
        },
      });
    }

    // 5. Update user with new role
    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { roleId: role.id },
      include: { role: true },
    });

    // 6. Log notification
    try {
      await this.prisma.notification.create({
        data: {
          organizationId,
          userId: targetUserId,
          type: 'ROLE_TRANSITION',
          title: 'Account Role Verified & Approved',
          body: `Your account has been verified and assigned to the ${role.name} role by your Administrator.`,
        },
      });
    } catch (_) {}

    return {
      success: true,
      message: `User ${updatedUser.firstName || updatedUser.email} verified and assigned to ${role.name}.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.email,
        role: role.name,
        hasAssignedRole: true,
        isVerified: true,
      },
    };
  }

  /**
   * Strictly upgrade an employee along the defined promotion hierarchy:
   * Sales Executive / Telecaller -> Team Leader (TL)
   * Team Leader (TL) -> Manager
   */
  async upgradeUserRole(
    organizationId: string,
    adminUserId: string,
    targetUserId: string,
  ) {
    if (!organizationId || !targetUserId) {
      throw new BadRequestException('Organization ID and Target User ID are required.');
    }

    // 1. Verify requester is Admin/Owner
    await this.assertAdminOrOwner(organizationId, adminUserId);

    // 2. Fetch target user with current role
    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, organizationId },
      include: { role: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found in this organization workspace.');
    }

    if (!targetUser.roleId || !targetUser.role || targetUser.role.name === 'UNASSIGNED') {
      throw new BadRequestException(
        'User is currently Unassigned. Please approve and verify their initial role first.',
      );
    }

    const currentRoleName = targetUser.role.name.toUpperCase();
    let nextRoleName: string;

    // Strict Progression Hierarchy:
    // Sales Executive (or Telecaller/Support) -> Team Leader (TL)
    // Team Leader (TL) -> Manager
    if (
      currentRoleName === 'SALES_EXEC' ||
      currentRoleName === 'SALES' ||
      currentRoleName === 'TELECALLER' ||
      currentRoleName === 'SUPPORT'
    ) {
      nextRoleName = 'TEAM_LEADER';
    } else if (
      currentRoleName === 'TEAM_LEADER' ||
      currentRoleName === 'TL' ||
      currentRoleName === 'LEAD'
    ) {
      nextRoleName = 'MANAGER';
    } else if (currentRoleName === 'MANAGER') {
      throw new BadRequestException(
        'Employee has already achieved the highest operational management rank (Manager).',
      );
    } else if (currentRoleName === 'HR') {
      throw new BadRequestException(
        'HR Manager role is an independent executive role and cannot be auto-upgraded in the Sales hierarchy.',
      );
    } else if (currentRoleName === 'ADMIN') {
      throw new BadRequestException('User is already a Company Admin.');
    } else {
      throw new BadRequestException(
        `No valid upgrade path available from current role ${currentRoleName}.`,
      );
    }

    // 3. Find or create the promoted role
    let promotedRole = await this.prisma.role.findFirst({
      where: { organizationId, name: nextRoleName },
    });

    if (!promotedRole) {
      promotedRole = await this.prisma.role.create({
        data: {
          organizationId,
          name: nextRoleName,
          recordScope: nextRoleName === 'MANAGER' ? 'ALL' : 'TEAM',
        },
      });
    }

    // 4. Update target user
    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { roleId: promotedRole.id },
      include: { role: true },
    });

    // 5. Create promotion notification
    try {
      await this.prisma.notification.create({
        data: {
          organizationId,
          userId: targetUserId,
          type: 'ROLE_TRANSITION',
          title: `Role Promotion: Upgraded to ${promotedRole.name}`,
          body: `Congratulations! Your role has been upgraded from ${currentRoleName} to ${promotedRole.name} by your Administrator.`,
        },
      });
    } catch (_) {}

    return {
      success: true,
      message: `Successfully promoted ${updatedUser.firstName || updatedUser.email} from ${currentRoleName} to ${promotedRole.name}.`,
      previousRole: currentRoleName,
      upgradedRole: promotedRole.name,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.email,
        role: promotedRole.name,
        hasAssignedRole: true,
      },
    };
  }

  private async assertAdminOrOwner(organizationId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
      include: { role: true, organization: true },
    });
    if (!user) throw new ForbiddenException('Access denied: user not found.');

    const isOrgAdminEmail =
      user.organization.adminEmail &&
      user.email.toLowerCase() === user.organization.adminEmail.toLowerCase();
    const roleName = user.role?.name?.toUpperCase() || '';
    const isRoleAdmin =
      roleName === 'ADMIN' || roleName === 'OWNER' || roleName === 'SUPER_ADMIN';

    if (!isOrgAdminEmail && !isRoleAdmin) {
      throw new ForbiddenException(
        'Only Company Admins can approve, verify, or upgrade employee roles.',
      );
    }
  }

  async updatePhone(organizationId: string, userId: string, phone: string) {
    if (!organizationId) return null;
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    await this.prisma.organization
      .update({
        where: { id: organizationId },
        data: { phone: cleanPhone },
      })
      .catch(() => null);

    return { success: true, phone: cleanPhone };
  }
}
