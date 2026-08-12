import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadQueryDto } from './dto/lead-query.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, query: LeadQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      statusId,
      ownerId,
      sourceId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      ...(statusId && { statusId }),
      ...(ownerId && { ownerId }),
      ...(sourceId && { sourceId }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          status: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          source: true,
          company: { select: { id: true, name: true } },
          _count: { select: { tasks: true, activities: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(organizationId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId },
      include: {
        status: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        team: true,
        source: true,
        company: true,
        deals: { include: { stage: true, pipeline: true } },
        tasks: { orderBy: { dueAt: 'asc' } },
        meetings: { orderBy: { startAt: 'asc' } },
        statusHistory: {
          include: { status: true },
          orderBy: { changedAt: 'desc' },
          take: 20,
        },
        activities: {
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
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        noteEntries: { orderBy: { createdAt: 'desc' } },
        quotations: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async create(
    organizationId: string,
    createdById: string,
    dto: CreateLeadDto,
  ) {
    const lead = await this.prisma.lead.create({
      data: {
        organizationId,
        createdById,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        statusId: dto.statusId,
        ownerId: dto.ownerId ?? createdById,
        sourceId: dto.sourceId,
        companyId: dto.companyId,
        customFields: dto.customFields ?? {},
        tags: dto.tags ?? [],
        notes: dto.notes,
      },
      include: {
        status: true,
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Log activity
    await this.prisma.activity.create({
      data: {
        organizationId,
        type: 'SYSTEM',
        leadId: lead.id,
        userId: createdById,
        description: 'Lead created',
      },
    });

    return lead;
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    dto: UpdateLeadDto,
  ) {
    const existing = await this.prisma.lead.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException('Lead not found');

    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
        ...(dto.companyId !== undefined && { companyId: dto.companyId }),
        ...(dto.sourceId !== undefined && { sourceId: dto.sourceId }),
        ...(dto.customFields && { customFields: dto.customFields }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        lastActivityAt: new Date(),
      },
    });

    return lead;
  }

  async changeStatus(
    organizationId: string,
    userId: string,
    id: string,
    statusId: string,
    notes?: string,
  ) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const status = await this.prisma.leadStatus.findFirst({
      where: { id: statusId, organizationId },
    });
    if (!status) throw new NotFoundException('Status not found');

    await this.prisma.$transaction([
      this.prisma.lead.update({
        where: { id },
        data: { statusId, lastActivityAt: new Date() },
      }),
      this.prisma.leadStatusHistory.create({
        data: { leadId: id, statusId, changedById: userId, notes },
      }),
      this.prisma.activity.create({
        data: {
          organizationId,
          type: 'STATUS_CHANGE',
          leadId: id,
          userId,
          description: `Status changed to "${status.name}"`,
          metadata: { fromStatusId: lead.statusId, toStatusId: statusId },
        },
      }),
    ]);

    return this.findOne(organizationId, id);
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.lead.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new NotFoundException('Lead not found');
    await this.prisma.lead.delete({ where: { id } });
    return { message: 'Lead deleted' };
  }

  async getTimeline(organizationId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    return this.prisma.activity.findMany({
      where: { organizationId, leadId: id },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // LEAD DISTRIBUTION ENGINE (3 MODELS + MANAGER ALLOCATION)
  // ═══════════════════════════════════════════════════════════

  /** Get Whitelist of Whitelisted Managers for Acquire Pool */
  async getAcquirePoolWhitelist(organizationId: string) {
    const managers = await this.prisma.user.findMany({
      where: {
        organizationId,
        isActive: true,
        role: { name: { in: ['ADMIN', 'MANAGER', 'OWNER', 'TEAM_LEADER'] } },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: { select: { name: true } },
      },
    });

    return {
      organizationId,
      eligibleManagers: managers.map((m) => ({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`.trim(),
        email: m.email,
        role: m.role?.name || 'MANAGER',
        isWhitelisted: true,
      })),
    };
  }

  /** Model 2: Dynamic "Grab" Pool — Get unassigned leads with anonymized serial # (Admin Whitelist Guarded) */
  async getOpenGrabPool(organizationId: string, userId?: string) {
    // Admin Access Guard check
    if (userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: userId, organizationId, isActive: true },
        include: { role: true },
      });

      const allowedRoles = ['ADMIN', 'MANAGER', 'OWNER', 'TEAM_LEADER'];
      if (!user || !user.role || !allowedRoles.includes(user.role.name)) {
        return {
          isWhitelisted: false,
          message: 'Access Denied: You are not on the Admin Eligibility Whitelist for the Acquire Pool.',
          leads: [],
        };
      }
    }

    const unassigned = await this.prisma.lead.findMany({
      where: { organizationId, ownerId: null },
      include: { source: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const leads = unassigned.map((l, index) => ({
      id: l.id,
      serialNo: `POOL-2026-${(1000 + index).toString()}`,
      source: l.source?.name ?? 'Web Ingestion',
      receivedAt: l.createdAt,
      status: 'UNCLAIMED',
    }));

    return {
      isWhitelisted: true,
      leads,
    };
  }

  /** Model 2: Dynamic "Grab" Pool — Rep claims lead from queue */
  async grabLeadFromPool(organizationId: string, userId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, organizationId },
    });
    if (!lead) throw new NotFoundException('Lead not found in open pool');
    if (lead.ownerId) {
      throw new ForbiddenException('Lead has already been claimed by another manager/rep');
    }

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: { ownerId: userId, lastActivityAt: new Date() },
      include: { owner: { select: { id: true, firstName: true, lastName: true } } },
    });

    await this.prisma.activity.create({
      data: {
        organizationId,
        type: 'SYSTEM',
        leadId,
        userId,
        description: 'Lead grabbed from speed-claim pool',
      },
    });

    return {
      success: true,
      lead: updated,
      message: `Acquired lead successfully! Assigned to ${updated.owner?.firstName || 'User'}`,
    };
  }

  /** Model 1: Custom Batch Quota Allocation */
  async customBatchQuotaAllocation(
    organizationId: string,
    dto: { allocations: { managerId: string; limit: number }[] },
  ) {
    let totalAllocated = 0;

    for (const alloc of dto.allocations) {
      const unassigned = await this.prisma.lead.findMany({
        where: { organizationId, ownerId: null },
        take: alloc.limit,
      });

      if (unassigned.length > 0) {
        await this.prisma.lead.updateMany({
          where: { id: { in: unassigned.map((l) => l.id) } },
          data: { ownerId: alloc.managerId, lastActivityAt: new Date() },
        });
        totalAllocated += unassigned.length;
      }
    }

    return {
      success: true,
      totalAllocated,
      message: `Batch quota allocation complete. Allocated ${totalAllocated} leads.`,
    };
  }

  /** Model 3: Direct Admin Funnel */
  async directAdminFunnel(
    organizationId: string,
    dto: { leadIds: string[]; targetManagerId: string },
  ) {
    await this.prisma.lead.updateMany({
      where: { id: { in: dto.leadIds }, organizationId },
      data: { ownerId: dto.targetManagerId, lastActivityAt: new Date() },
    });

    return {
      success: true,
      count: dto.leadIds.length,
      message: `Fanneled ${dto.leadIds.length} leads directly to designated Manager.`,
    };
  }

  /** Downstream Manager Allocation Control (Manager -> TL / Staff) */
  async managerDownstreamAllocate(
    organizationId: string,
    managerId: string,
    dto: { leadIds: string[]; targetUserId: string },
  ) {
    await this.prisma.lead.updateMany({
      where: { id: { in: dto.leadIds }, organizationId },
      data: { ownerId: dto.targetUserId, lastActivityAt: new Date() },
    });

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.targetUserId },
      select: { firstName: true, lastName: true, role: true },
    });

    return {
      success: true,
      count: dto.leadIds.length,
      message: `Allocated ${dto.leadIds.length} leads to ${targetUser?.firstName || 'User'} (${targetUser?.role?.name || 'Staff'})`,
    };
  }
}
