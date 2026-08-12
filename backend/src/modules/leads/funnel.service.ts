import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type FunnelModel = 'CUSTOM_BATCH' | 'DYNAMIC_GRAB' | 'DIRECT_ADMIN';

@Injectable()
export class LeadFunnelService {
  constructor(private prisma: PrismaService) {}

  /**
   * Model 1: Custom Batch Quota Allocation
   * Allocates leads by index range (e.g. 1-100 to Manager A, 101-200 to Manager B)
   */
  async allocateBatchQuota(tenantId: string, managerId: string, startRange: number, endRange: number) {
    const limit = Math.max(1, endRange - startRange + 1);
    const skip = Math.max(0, startRange - 1);

    const unassignedLeads = await this.prisma.lead.findMany({
      where: { tenantId, assignedToId: null },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
      select: { id: true },
    });

    if (unassignedLeads.length === 0) {
      return { message: 'No unassigned leads found in specified range', allocatedCount: 0 };
    }

    const leadIds = unassignedLeads.map(l => l.id);

    await this.prisma.lead.updateMany({
      where: { id: { in: leadIds }, tenantId },
      data: { assignedToId: managerId },
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
  async claimDynamicLead(tenantId: string, userId: string, leadId: string) {
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        select: { id: true, tenantId: true, assignedToId: true, leadNumber: true },
      });

      if (!lead || lead.tenantId !== tenantId) {
        throw new NotFoundException('Lead not found in tenant pool');
      }

      if (lead.assignedToId !== null) {
        throw new BadRequestException('Lead has already been claimed and vanished from open pool');
      }

      const updated = await tx.lead.update({
        where: { id: leadId },
        data: {
          assignedToId: userId,
          status: 'QUALIFIED',
        },
      });

      return {
        success: true,
        message: `Lead ${lead.leadNumber || lead.id} acquired successfully. Vanished from open pool.`,
        lead: updated,
      };
    });
  }

  /**
   * Model 3: Direct Admin Funneling
   * Manual targeting by Tenant Admin to a designated Manager
   */
  async directAdminFunnel(tenantId: string, leadIds: string[], managerId: string) {
    const res = await this.prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        tenantId,
      },
      data: { assignedToId: managerId },
    });

    return {
      message: `Direct Admin Funnel: Allocated ${res.count} leads to Manager`,
      count: res.count,
    };
  }
}
