import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../auth/mail.service';
import { ActivityExportService } from './activity-export.service';
import { RoleTransitionStatus, UserRole } from '@prisma/client';

@Injectable()
export class RoleTransitionService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private activityExportService: ActivityExportService,
  ) {}

  /**
   * Admin initiates a role change → creates 24-hour lock.
   */
  async initiateRoleTransition(dto: {
    userId: string;
    newRole: UserRole;
    initiatedByAdminId: string;
    organizationId: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Check for existing active transition
    const existing = await this.prisma.roleTransition.findFirst({
      where: { userId: dto.userId, status: 'PENDING' },
    });
    if (existing) {
      throw new BadRequestException('User already has an active role transition in progress');
    }

    const oldRole = (user.role?.name ?? 'VIEWER') as UserRole;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const transition = await this.prisma.roleTransition.create({
      data: {
        organizationId: dto.organizationId,
        userId: dto.userId,
        oldRole,
        newRole: dto.newRole,
        initiatedByAdminId: dto.initiatedByAdminId,
        status: 'PENDING',
        expiresAt,
      },
    });

    // Send email to user
    try {
      await this.mailService.sendRoleTransitionNotification(
        user.email,
        `${user.firstName} ${user.lastName}`,
        oldRole,
        dto.newRole,
        expiresAt,
      );
      await this.prisma.roleTransition.update({
        where: { id: transition.id },
        data: { userNotifiedAt: new Date() },
      });
    } catch (err) {
      console.error('[RoleTransition] Failed to send user email:', err);
    }

    // Create in-app notification
    await this.prisma.notification.create({
      data: {
        organizationId: dto.organizationId,
        userId: dto.userId,
        type: 'ROLE_TRANSITION',
        title: 'Your Role is Being Changed',
        body: `Your role is changing from ${oldRole} to ${dto.newRole}. Your account is in Read-Only mode for 24 hours. Please accept the new role.`,
        data: { transitionId: transition.id, oldRole, newRole: dto.newRole },
      },
    });

    return transition;
  }

  /**
   * User accepts their new role →
   *  1. Export old activity log to PDF
   *  2. Store in DB + send PDF to user & admin email
   *  3. Apply new role, release lock
   */
  async acceptRoleTransition(userId: string) {
    const transition = await this.prisma.roleTransition.findFirst({
      where: { userId, status: 'PENDING' },
    });
    if (!transition) {
      throw new NotFoundException('No active role transition found for this user');
    }
    if (transition.expiresAt < new Date()) {
      await this.prisma.roleTransition.update({
        where: { id: transition.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Role transition window has expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    // Find the new role record
    const newRoleRecord = await this.prisma.role.findFirst({
      where: { organizationId: transition.organizationId, name: transition.newRole },
    });

    // Export old activity log PDF
    let exportLog;
    try {
      exportLog = await this.activityExportService.exportUserActivityPdf(
        userId,
        transition.organizationId,
        transition.id,
        `${user!.firstName} ${user!.lastName}`,
        transition.oldRole,
      );

      // Send PDF to user and admin emails
      const downloadExpiry = new Date(exportLog.downloadExpiresAt);
      await this.mailService.sendActivityExportPdf(
        user!.email,
        `${user!.firstName} ${user!.lastName}`,
        exportLog.downloadUrl,
        downloadExpiry,
        false,
      );

      // Get admin email
      const adminUser = await this.prisma.user.findFirst({
        where: { id: transition.initiatedByAdminId },
      });
      if (adminUser) {
        await this.mailService.sendActivityExportPdf(
          adminUser.email,
          `${user!.firstName} ${user!.lastName}`,
          exportLog.downloadUrl,
          downloadExpiry,
          true,
        );
        // Notify admin
        await this.mailService.sendRoleTransitionAdminNotification(
          adminUser.email,
          `${adminUser.firstName} ${adminUser.lastName}`,
          `${user!.firstName} ${user!.lastName}`,
          'ACCEPTED',
          transition.newRole,
        );
      }
    } catch (err) {
      console.error('[RoleTransition] PDF export failed:', err);
    }

    // Apply new role and mark transition ACCEPTED
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { roleId: newRoleRecord?.id ?? null },
      }),
      this.prisma.roleTransition.update({
        where: { id: transition.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      }),
    ]);

    return { message: 'New role accepted. Your account is now fully active.', newRole: transition.newRole };
  }

  /**
   * Admin reverts a role change within the 24-hour window.
   */
  async revertRoleTransition(transitionId: string, adminId: string) {
    const transition = await this.prisma.roleTransition.findUnique({
      where: { id: transitionId },
    });
    if (!transition) throw new NotFoundException('Role transition not found');
    if (transition.initiatedByAdminId !== adminId) {
      throw new ForbiddenException('Only the initiating admin can revert this transition');
    }
    if (transition.status !== 'PENDING') {
      throw new BadRequestException('Can only revert a PENDING transition');
    }
    if (transition.expiresAt < new Date()) {
      throw new BadRequestException('Revert window has expired (24 hours exceeded)');
    }

    // Restore old role
    const oldRoleRecord = await this.prisma.role.findFirst({
      where: { organizationId: transition.organizationId, name: transition.oldRole },
    });

    const user = await this.prisma.user.findUnique({ where: { id: transition.userId } });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: transition.userId },
        data: { roleId: oldRoleRecord?.id ?? null },
      }),
      this.prisma.roleTransition.update({
        where: { id: transitionId },
        data: { status: 'REVERTED', revertedAt: new Date() },
      }),
    ]);

    // Notify admin
    if (user) {
      const adminUser = await this.prisma.user.findUnique({ where: { id: adminId } });
      if (adminUser) {
        await this.mailService.sendRoleTransitionAdminNotification(
          adminUser.email,
          `${adminUser.firstName} ${adminUser.lastName}`,
          `${user.firstName} ${user.lastName}`,
          'REVERTED',
          transition.oldRole,
        );
      }
    }

    return { message: 'Role transition reverted. User restored to original role.' };
  }

  /**
   * Check if a user currently has an active (PENDING) role transition lock.
   * Returns the transition record or null.
   */
  async getActiveTransition(userId: string) {
    const transition = await this.prisma.roleTransition.findFirst({
      where: { userId, status: 'PENDING', expiresAt: { gt: new Date() } },
    });
    return transition;
  }

  /**
   * Check if a user is locked (for use in Guard).
   */
  async isUserLocked(userId: string): Promise<boolean> {
    const t = await this.getActiveTransition(userId);
    return !!t;
  }
}
