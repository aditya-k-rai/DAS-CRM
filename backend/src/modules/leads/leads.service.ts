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
}
