import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecordScope } from '@prisma/client';

const DEFAULT_PERMISSIONS = [
  // Leads
  { resource: 'leads', action: 'view', description: 'View lead records' },
  { resource: 'leads', action: 'create', description: 'Create new leads' },
  { resource: 'leads', action: 'edit', description: 'Edit lead details' },
  { resource: 'leads', action: 'delete', description: 'Delete leads' },
  { resource: 'leads', action: 'assign', description: 'Assign lead ownership' },
  { resource: 'leads', action: 'export', description: 'Export leads to CSV' },

  // Deals & Pipelines
  { resource: 'deals', action: 'view', description: 'View deals and pipelines' },
  { resource: 'deals', action: 'create', description: 'Create deals' },
  { resource: 'deals', action: 'edit', description: 'Update deal stage and values' },
  { resource: 'deals', action: 'delete', description: 'Delete deals' },

  // Contacts & Companies
  { resource: 'contacts', action: 'view', description: 'View customer contacts' },
  { resource: 'contacts', action: 'create', description: 'Create contacts' },
  { resource: 'companies', action: 'view', description: 'View client companies' },

  // HR & Payroll
  { resource: 'attendance', action: 'view', description: 'View employee attendance' },
  { resource: 'attendance', action: 'edit', description: 'Mark or edit attendance' },
  { resource: 'leaves', action: 'approve', description: 'Approve or reject leave requests' },
  { resource: 'salary', action: 'view', description: 'View salary records' },
  { resource: 'salary', action: 'configure', description: 'Manage salary structures' },

  // Settings & System
  { resource: 'settings', action: 'configure', description: 'Manage organization settings' },
  { resource: 'reports', action: 'view', description: 'View analytics and reports' },
];

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedPermissions();
  }

  /** Seed default permissions if database table is empty */
  async seedPermissions() {
    try {
      for (const p of DEFAULT_PERMISSIONS) {
        await this.prisma.permission.upsert({
          where: { resource_action: { resource: p.resource, action: p.action } },
          update: { description: p.description },
          create: p,
        });
      }
    } catch (e) {
      // Non-fatal if DB migration running
    }
  }

  /** Get all roles for an organization */
  async getRoles(organizationId: string) {
    const roles = await this.prisma.role.findMany({
      where: { organizationId },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { users: true } },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      isSystem: r.isSystem,
      recordScope: r.recordScope,
      userCount: r._count.users,
      permissions: r.permissions.map((p) => ({
        id: p.permission.id,
        resource: p.permission.resource,
        action: p.permission.action,
        description: p.permission.description,
      })),
      createdAt: r.createdAt,
    }));
  }

  /** Get all available system permissions */
  async getPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  /** Create a new custom role with permissions & scope */
  async createRole(
    organizationId: string,
    dto: {
      name: string;
      recordScope?: RecordScope;
      permissionIds?: string[];
    },
  ) {
    const existing = await this.prisma.role.findFirst({
      where: { organizationId, name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(`Role "${dto.name}" already exists in this workspace`);
    }

    const role = await this.prisma.role.create({
      data: {
        organizationId,
        name: dto.name,
        isSystem: false,
        recordScope: dto.recordScope ?? RecordScope.OWN,
        permissions: dto.permissionIds && dto.permissionIds.length > 0
          ? {
              create: dto.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        permissions: { include: { permission: true } },
      },
    });

    return role;
  }

  /** Update an existing role */
  async updateRole(
    organizationId: string,
    roleId: string,
    dto: {
      name?: string;
      recordScope?: RecordScope;
      permissionIds?: string[];
    },
  ) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId },
    });
    if (!role) throw new NotFoundException('Role not found');

    if (dto.permissionIds !== undefined) {
      await this.prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      if (dto.permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    }

    const updated = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: role.isSystem ? role.name : (dto.name ?? role.name),
        recordScope: dto.recordScope ?? role.recordScope,
      },
      include: {
        permissions: { include: { permission: true } },
      },
    });

    return updated;
  }

  /** Delete a custom role */
  async deleteRole(organizationId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId },
      include: { _count: { select: { users: true } } },
    });

    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) {
      throw new ForbiddenException('Cannot delete system default roles (OWNER, ADMIN, HR, etc.)');
    }
    if (role._count.users > 0) {
      throw new BadRequestException(
        `Cannot delete role currently assigned to ${role._count.users} active users. Reassign users first.`,
      );
    }

    await this.prisma.role.delete({ where: { id: roleId } });
    return { message: 'Role deleted successfully' };
  }
}
