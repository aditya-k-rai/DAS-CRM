import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type FunnelModel = 'CUSTOM_BATCH' | 'DYNAMIC_GRAB' | 'DIRECT_ADMIN';

@Injectable()
export class LeadFunnelService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper to resolve or create the default 'New' lead status for the tenant organization
   */
  private async resolveNewStatus(organizationId: string, tx?: any) {
    const client = tx || this.prisma;
    let newStatus = await client.leadStatus.findFirst({
      where: { organizationId, name: { equals: 'New', mode: 'insensitive' } },
    });
    if (!newStatus) {
      newStatus = await client.leadStatus.findFirst({
        where: { organizationId, isDefault: true },
        orderBy: { order: 'asc' },
      });
    }
    if (!newStatus) {
      newStatus = await client.leadStatus.create({
        data: {
          organizationId,
          name: 'New',
          color: '#6366f1',
          order: 0,
          isDefault: true,
        },
      });
    }
    return newStatus;
  }

  /**
   * Model 1: Custom Batch Quota Allocation
   * Allocates leads by index range (e.g. 1-100 to Manager A, 101-200 to Manager B)
   */
  async allocateBatchQuota(
    organizationId: string,
    managerId: string,
    startRange: number,
    endRange: number,
  ) {
    const limit = Math.max(1, endRange - startRange + 1);
    const skip = Math.max(0, startRange - 1);

    const unassignedLeads = await this.prisma.lead.findMany({
      where: { organizationId, ownerId: null },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
      select: { id: true },
    });

    if (unassignedLeads.length === 0) {
      return {
        message: 'No unassigned leads found in specified range',
        allocatedCount: 0,
      };
    }

    const leadIds = unassignedLeads.map((l) => l.id);
    const newStatus = await this.resolveNewStatus(organizationId);

    await this.prisma.lead.updateMany({
      where: { id: { in: leadIds }, organizationId },
      data: {
        ownerId: managerId,
        statusId: newStatus.id,
      },
    });

    return {
      message: `Successfully allocated ${leadIds.length} leads to Manager ${managerId}`,
      allocatedCount: leadIds.length,
      leadIds,
    };
  }

  /**
   * Model 2: Dynamic "Grab" Flow (Atomic "Claim & Vanish" with Prisma Transaction)
   * Prevents race conditions. As soon as user claims, lead is acquired and vanishes for others.
   */
  async claimDynamicLead(
    organizationId: string,
    userId: string,
    leadId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        select: { id: true, organizationId: true, ownerId: true },
      });

      if (!lead || lead.organizationId !== organizationId) {
        throw new NotFoundException('Lead not found in tenant pool');
      }

      if (lead.ownerId !== null) {
        throw new BadRequestException(
          'Lead has already been claimed and vanished from open pool',
        );
      }

      const newStatus = await this.resolveNewStatus(organizationId, tx);

      const updated = await tx.lead.update({
        where: { id: leadId },
        data: {
          ownerId: userId,
          statusId: newStatus.id,
        },
      });

      return {
        success: true,
        message: `Lead ${lead.id} acquired successfully. Vanished from open pool.`,
        lead: updated,
      };
    });
  }

  /**
   * Model 3: Direct Admin Funneling
   * Manual targeting by Tenant Admin to a designated Manager
   */
  async directAdminFunnel(
    organizationId: string,
    leadIds: string[],
    managerId: string,
  ) {
    const newStatus = await this.resolveNewStatus(organizationId);

    const res = await this.prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        organizationId,
      },
      data: {
        ownerId: managerId,
        statusId: newStatus.id,
      },
    });

    return {
      message: `Direct Admin Funnel: Allocated ${res.count} leads to Manager`,
      count: res.count,
    };
  }
}
