import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const FOLLOW_UP_TYPES = ['CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'VISIT', 'QUOTATION', 'PAYMENT', 'GENERAL'];
const PRIORITIES = ['HIGH', 'MEDIUM', 'NORMAL'];
const STATUSES = ['PENDING', 'DUE', 'COMPLETED', 'OVERDUE', 'RESCHEDULED', 'CANCELLED', 'MISSED'];

@Injectable()
export class FollowUpsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Build the authorization WHERE clause for a user.
   * Admins and Managers have org-wide visibility. Reps see assigned/created items.
   */
  private getOwnershipScope(userId: string, userRole?: string | any) {
    const rawRole = typeof userRole === 'string' ? userRole : (userRole?.name || '');
    const r = (rawRole || '').toUpperCase();
    if (r.includes('ADMIN') || r.includes('MANAGER') || r.includes('OWNER') || r.includes('SUPER_ADMIN')) {
      return {};
    }
    return {
      OR: [
        { assigneeId: userId },
        { createdById: userId },
        { lead: { ownerId: userId } },
      ],
    };
  }

  /**
   * Base where clause that always scopes to organization + FOLLOW_UP taskType.
   */
  private baseWhere(organizationId: string, userId: string, userRole?: string) {
    return {
      organizationId,
      taskType: 'FOLLOW_UP',
      ...this.getOwnershipScope(userId, userRole),
    };
  }

  /**
   * Compute the effective status of a follow-up based on its state and time.
   */
  private computeStatus(task: any): string {
    if (task.status === 'CANCELLED') return 'CANCELLED';
    if (task.status === 'MISSED') return 'MISSED';
    if (task.isCompleted || task.status === 'COMPLETED') return 'COMPLETED';
    if (task.status === 'RESCHEDULED') return 'RESCHEDULED';
    
    if (task.dueAt) {
      const now = new Date();
      const dueTime = new Date(task.dueAt);
      if (dueTime < now) return 'OVERDUE';
      // Due within 30 minutes
      const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000);
      if (dueTime <= thirtyMinFromNow) return 'DUE';
    }
    return 'PENDING';
  }

  private includeRelations() {
    return {
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: { select: { id: true, name: true } },
        },
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: { select: { id: true, name: true } },
        },
      },
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: { select: { id: true, name: true } },
          status: { select: { id: true, name: true, color: true } },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              role: { select: { id: true, name: true } },
            },
          },
        },
      },
    };
  }

  /**
   * List follow-ups with filters, search, sorting, and pagination.
   */
  async findAll(
    organizationId: string,
    userId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      followUpType?: string;
      priority?: string;
      dateFrom?: string;
      dateTo?: string;
      leadId?: string;
      assignedTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    userRole?: string,
  ) {
    const {
      page = 1,
      limit = 50,
      search,
      status,
      followUpType,
      priority,
      dateFrom,
      dateTo,
      leadId,
      assignedTo,
      sortBy = 'dueAt',
      sortOrder = 'asc',
    } = query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(String(limit), 10) || 50));

    const base = this.baseWhere(organizationId, userId, userRole);
    const where: any = { ...base };

    if (assignedTo) {
      where.assigneeId = assignedTo;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    // Status filter (compute-aware)
    if (status && status !== 'ALL') {
      if (status === 'OVERDUE') {
        where.isCompleted = false;
        where.status = { notIn: ['CANCELLED', 'MISSED', 'COMPLETED'] };
        where.dueAt = { lt: todayStart };
      } else if (status === 'TODAY') {
        where.dueAt = { gte: todayStart, lte: todayEnd };
      } else if (status === 'UPCOMING' || status === 'PENDING') {
        where.isCompleted = false;
        where.status = { notIn: ['CANCELLED', 'MISSED', 'COMPLETED'] };
        where.dueAt = { gt: todayEnd };
      } else if (status === 'COMPLETED') {
        where.OR = [
          { isCompleted: true },
          { status: 'COMPLETED' },
        ];
      } else {
        where.status = status;
      }
    }

    if (followUpType) where.followUpType = followUpType;
    if (priority) where.priority = priority;
    if (leadId) where.leadId = leadId;

    if (dateFrom || dateTo) {
      where.dueAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) } : {}),
      };
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { purpose: { contains: search, mode: 'insensitive' } },
            { lead: { firstName: { contains: search, mode: 'insensitive' } } },
            { lead: { lastName: { contains: search, mode: 'insensitive' } } },
            { lead: { email: { contains: search, mode: 'insensitive' } } },
            { lead: { phone: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const validSortFields = ['dueAt', 'createdAt', 'updatedAt', 'priority', 'title'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'dueAt';

    const [total, items] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        include: this.includeRelations(),
        orderBy: { [orderField]: sortOrder },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    ]);

    // Enrich with computed status
    const enriched = items.map((item) => ({
      ...item,
      computedStatus: this.computeStatus(item),
    }));

    return {
      data: enriched,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    };
  }

  /**
   * Get a single follow-up with full details + related activity timeline.
   */
  async findOne(organizationId: string, userId: string, id: string, userRole?: string) {
    const base = this.baseWhere(organizationId, userId, userRole);
    const followUp = await this.prisma.task.findFirst({
      where: {
        id,
        ...base,
      },
      include: {
        ...this.includeRelations(),
        lead: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true,
            company: { select: { id: true, name: true } },
            status: { select: { id: true, name: true, color: true } },
            activities: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
              },
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
        },
      },
    });

    if (!followUp) {
      throw new NotFoundException('Follow-up not found or you are not authorized to access it.');
    }

    return {
      ...followUp,
      computedStatus: this.computeStatus(followUp),
    };
  }

  /**
   * Create a new follow-up.
   */
  async create(
    organizationId: string,
    userId: string,
    dto: {
      title: string;
      leadId?: string;
      contactId?: string;
      dealId?: string;
      followUpType: string;
      scheduledDate: string;
      scheduledTime?: string;
      priority?: string;
      purpose?: string;
      notes?: string;
      reminderMinutes?: number;
      assigneeId?: string;
    },
  ) {
    if (!dto.title?.trim()) {
      throw new BadRequestException('Please provide a follow-up title.');
    }
    const cleanType = (dto.followUpType || 'CALL').toUpperCase();
    const followUpType = FOLLOW_UP_TYPES.includes(cleanType) ? cleanType : 'CALL';

    if (!dto.scheduledDate) {
      throw new BadRequestException('Please select a valid follow-up date.');
    }

    // Parse scheduled date + time
    let dueAt: Date;
    if (dto.scheduledTime) {
      dueAt = new Date(`${dto.scheduledDate}T${dto.scheduledTime}`);
    } else {
      dueAt = new Date(`${dto.scheduledDate}T09:00:00`);
    }

    if (isNaN(dueAt.getTime())) {
      dueAt = new Date();
    }

    const priority = dto.priority && PRIORITIES.includes(dto.priority) ? dto.priority : 'MEDIUM';

    // Calculate reminder time
    let reminderAt: Date | null = null;
    if (dto.reminderMinutes && dto.reminderMinutes > 0) {
      reminderAt = new Date(dueAt.getTime() - dto.reminderMinutes * 60 * 1000);
    }

    // Validate leadId ownership if provided (safe fallback if client lead is offline/mock)
    let validLeadId: string | undefined = undefined;
    if (dto.leadId) {
      try {
        const lead = await this.prisma.lead.findFirst({
          where: { id: dto.leadId, organizationId },
        });
        if (lead) {
          validLeadId = lead.id;
        }
      } catch (_) {}
    }

    const assigneeId = dto.assigneeId || userId;

    const followUp = await this.prisma.task.create({
      data: {
        organizationId,
        createdById: userId,
        assigneeId,
        title: dto.title.trim(),
        description: dto.notes,
        dueAt,
        taskType: 'FOLLOW_UP',
        followUpType,
        priority,
        status: 'PENDING',
        purpose: dto.purpose,
        reminderAt,
        leadId: validLeadId,
        contactId: dto.contactId,
        dealId: dto.dealId,
      },
      include: this.includeRelations(),
    });

    // Log activity if linked to a valid DB lead
    if (validLeadId) {
      await this.prisma.activity.create({
        data: {
          organizationId,
          type: 'TASK',
          userId,
          leadId: validLeadId,
          description: `Follow-up created: ${dto.title.trim()} (${followUpType})`,
          metadata: { followUpId: followUp.id, followUpType },
        },
      }).catch(() => null);
    }

    return { ...followUp, computedStatus: 'PENDING' };
  }

  /**
   * Update a follow-up.
   */
  async update(
    organizationId: string,
    userId: string,
    id: string,
    dto: {
      title?: string;
      followUpType?: string;
      scheduledDate?: string;
      scheduledTime?: string;
      priority?: string;
      purpose?: string;
      notes?: string;
      nextAction?: string;
      lastInteraction?: string;
      reminderMinutes?: number;
      leadId?: string;
      contactId?: string;
      dealId?: string;
    },
  ) {
    const existing = await this.prisma.task.findFirst({
      where: {
        id,
        organizationId,
        taskType: 'FOLLOW_UP',
        ...this.getOwnershipScope(userId),
      },
    });

    if (!existing) {
      throw new NotFoundException('Follow-up not found or you are not authorized to access it.');
    }

    if (existing.isCompleted || existing.status === 'COMPLETED') {
      throw new BadRequestException('Cannot edit a completed follow-up.');
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.followUpType && FOLLOW_UP_TYPES.includes(dto.followUpType)) data.followUpType = dto.followUpType;
    if (dto.priority && PRIORITIES.includes(dto.priority)) data.priority = dto.priority;
    if (dto.purpose !== undefined) data.purpose = dto.purpose;
    if (dto.notes !== undefined) data.description = dto.notes;
    if (dto.nextAction !== undefined) data.nextAction = dto.nextAction;
    if (dto.lastInteraction !== undefined) data.lastInteraction = dto.lastInteraction;
    if (dto.leadId !== undefined) data.leadId = dto.leadId || null;
    if (dto.contactId !== undefined) data.contactId = dto.contactId || null;
    if (dto.dealId !== undefined) data.dealId = dto.dealId || null;

    if (dto.scheduledDate) {
      const time = dto.scheduledTime || '09:00:00';
      const dueAt = new Date(`${dto.scheduledDate}T${time}`);
      if (!isNaN(dueAt.getTime())) {
        data.dueAt = dueAt;
      }
    }

    if (dto.reminderMinutes !== undefined && data.dueAt) {
      data.reminderAt = dto.reminderMinutes > 0
        ? new Date(data.dueAt.getTime() - dto.reminderMinutes * 60 * 1000)
        : null;
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data,
      include: this.includeRelations(),
    });

    return { ...updated, computedStatus: this.computeStatus(updated) };
  }

  /**
   * Complete a follow-up with outcome, notes, and optional next follow-up creation.
   */
  async complete(
    organizationId: string,
    userId: string,
    id: string,
    dto: {
      outcome?: string;
      completionNotes?: string;
      nextAction?: string;
      createNextFollowUp?: boolean;
      nextFollowUpDate?: string;
      nextFollowUpTime?: string;
      nextFollowUpType?: string;
      nextFollowUpTitle?: string;
    },
  ) {
    const existing = await this.prisma.task.findFirst({
      where: {
        id,
        organizationId,
        taskType: 'FOLLOW_UP',
        ...this.getOwnershipScope(userId),
      },
    });

    if (!existing) {
      throw new NotFoundException('Follow-up not found or you are not authorized to access it.');
    }

    if (existing.isCompleted) {
      throw new BadRequestException('This follow-up is already completed.');
    }

    const now = new Date();
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: now,
        completedById: userId,
        status: 'COMPLETED',
        outcome: dto.outcome,
        completionNotes: dto.completionNotes,
        nextAction: dto.nextAction,
      },
      include: this.includeRelations(),
    });

    // Log activity
    if (existing.leadId) {
      await this.prisma.activity.create({
        data: {
          organizationId,
          type: 'TASK',
          userId,
          leadId: existing.leadId,
          description: `Follow-up completed: ${existing.title}. Outcome: ${dto.outcome || 'N/A'}`,
          metadata: {
            followUpId: id,
            outcome: dto.outcome,
            nextAction: dto.nextAction,
          },
        },
      }).catch(() => null);
    }

    // Create next follow-up if requested
    let nextFollowUp: any = null;
    if (dto.createNextFollowUp && dto.nextFollowUpDate) {
      const nextTime = dto.nextFollowUpTime || '09:00:00';
      const nextDueAt = new Date(`${dto.nextFollowUpDate}T${nextTime}`);
      if (!isNaN(nextDueAt.getTime())) {
        nextFollowUp = await this.prisma.task.create({
          data: {
            organizationId,
            createdById: userId,
            assigneeId: existing.assigneeId || userId,
            title: dto.nextFollowUpTitle || `Follow-up: ${existing.title}`,
            dueAt: nextDueAt,
            taskType: 'FOLLOW_UP',
            followUpType: dto.nextFollowUpType || existing.followUpType || 'GENERAL',
            priority: existing.priority || 'MEDIUM',
            status: 'PENDING',
            leadId: existing.leadId,
            contactId: existing.contactId,
            dealId: existing.dealId,
            lastInteraction: `Previous: ${dto.outcome || 'Completed'}`,
          },
          include: this.includeRelations(),
        });
      }
    }

    return {
      followUp: { ...updated, computedStatus: 'COMPLETED' },
      nextFollowUp: nextFollowUp ? { ...nextFollowUp, computedStatus: 'PENDING' } : null,
    };
  }

  /**
   * Reschedule a follow-up to a new date/time.
   */
  async reschedule(
    organizationId: string,
    userId: string,
    id: string,
    dto: {
      newDate: string;
      newTime?: string;
      reason?: string;
    },
  ) {
    const existing = await this.prisma.task.findFirst({
      where: {
        id,
        organizationId,
        taskType: 'FOLLOW_UP',
        ...this.getOwnershipScope(userId),
      },
    });

    if (!existing) {
      throw new NotFoundException('Follow-up not found or you are not authorized to access it.');
    }

    if (existing.isCompleted) {
      throw new BadRequestException('Cannot reschedule a completed follow-up.');
    }

    if (!dto.newDate) {
      throw new BadRequestException('Please select a valid new date.');
    }

    const newTime = dto.newTime || '09:00:00';
    const newDueAt = new Date(`${dto.newDate}T${newTime}`);
    if (isNaN(newDueAt.getTime())) {
      throw new BadRequestException('Please select a valid new date.');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        rescheduledFrom: existing.dueAt,
        rescheduleReason: dto.reason,
        dueAt: newDueAt,
        status: 'RESCHEDULED',
      },
      include: this.includeRelations(),
    });

    // Log activity
    if (existing.leadId) {
      await this.prisma.activity.create({
        data: {
          organizationId,
          type: 'TASK',
          userId,
          leadId: existing.leadId,
          description: `Follow-up rescheduled: ${existing.title} to ${dto.newDate}`,
          metadata: {
            followUpId: id,
            originalDate: existing.dueAt,
            newDate: newDueAt,
            reason: dto.reason,
          },
        },
      }).catch(() => null);
    }

    return { ...updated, computedStatus: this.computeStatus(updated) };
  }

  /**
   * Cancel a follow-up.
   */
  async cancel(
    organizationId: string,
    userId: string,
    id: string,
    dto: { reason?: string },
  ) {
    const existing = await this.prisma.task.findFirst({
      where: {
        id,
        organizationId,
        taskType: 'FOLLOW_UP',
        ...this.getOwnershipScope(userId),
      },
    });

    if (!existing) {
      throw new NotFoundException('Follow-up not found or you are not authorized to access it.');
    }

    if (existing.isCompleted) {
      throw new BadRequestException('Cannot cancel a completed follow-up.');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledReason: dto.reason,
      },
      include: this.includeRelations(),
    });

    // Log activity
    if (existing.leadId) {
      await this.prisma.activity.create({
        data: {
          organizationId,
          type: 'TASK',
          userId,
          leadId: existing.leadId,
          description: `Follow-up cancelled: ${existing.title}. Reason: ${dto.reason || 'N/A'}`,
          metadata: {
            followUpId: id,
            cancelledBy: userId,
            reason: dto.reason,
          },
        },
      }).catch(() => null);
    }

    return { ...updated, computedStatus: 'CANCELLED' };
  }

  /**
   * Add a note to a follow-up (stored as lastInteraction update + activity log).
   */
  async addNote(
    organizationId: string,
    userId: string,
    id: string,
    dto: { note: string },
  ) {
    const existing = await this.prisma.task.findFirst({
      where: {
        id,
        organizationId,
        taskType: 'FOLLOW_UP',
        ...this.getOwnershipScope(userId),
      },
    });

    if (!existing) {
      throw new NotFoundException('Follow-up not found or you are not authorized to access it.');
    }

    // Update last interaction
    await this.prisma.task.update({
      where: { id },
      data: { lastInteraction: dto.note },
    });

    // Log as activity
    if (existing.leadId) {
      await this.prisma.activity.create({
        data: {
          organizationId,
          type: 'NOTE',
          userId,
          leadId: existing.leadId,
          description: dto.note,
          metadata: { followUpId: id },
        },
      }).catch(() => null);
    }

    return { success: true, message: 'Note added successfully.' };
  }

  /**
   * Get follow-up summary counts for dashboard cards.
   */
  async getSummary(organizationId: string, userId: string, userRole?: string) {
    const base = this.baseWhere(organizationId, userId, userRole);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    const [total, today, upcoming, overdue, completed, highPriority, mediumPriority, normalPriority] =
      await Promise.all([
        this.prisma.task.count({ where: base }),
        this.prisma.task.count({
          where: { ...base, dueAt: { gte: todayStart, lte: todayEnd } },
        }),
        this.prisma.task.count({
          where: {
            ...base,
            isCompleted: false,
            status: { notIn: ['CANCELLED', 'MISSED', 'COMPLETED'] },
            dueAt: { gt: todayEnd },
          },
        }),
        this.prisma.task.count({
          where: {
            ...base,
            isCompleted: false,
            status: { notIn: ['CANCELLED', 'MISSED', 'COMPLETED'] },
            dueAt: { lt: todayStart },
          },
        }),
        this.prisma.task.count({
          where: {
            ...base,
            OR: [
              { isCompleted: true },
              { status: 'COMPLETED' },
            ],
          },
        }),
        this.prisma.task.count({
          where: { ...base, priority: 'HIGH', isCompleted: false, status: { notIn: ['CANCELLED', 'MISSED', 'COMPLETED'] } },
        }),
        this.prisma.task.count({
          where: { ...base, priority: 'MEDIUM', isCompleted: false, status: { notIn: ['CANCELLED', 'MISSED', 'COMPLETED'] } },
        }),
        this.prisma.task.count({
          where: { ...base, priority: 'NORMAL', isCompleted: false, status: { notIn: ['CANCELLED', 'MISSED', 'COMPLETED'] } },
        }),
      ]);

    const completedToday = await this.prisma.task.count({
      where: {
        ...base,
        OR: [
          { isCompleted: true },
          { status: 'COMPLETED' },
        ],
        completedAt: { gte: todayStart, lte: todayEnd },
      },
    });

    return {
      total,
      today,
      upcoming,
      overdue,
      completed,
      completedToday,
      priority: { high: highPriority, medium: mediumPriority, normal: normalPriority },
    };
  }

  /**
   * Get today's follow-ups segmented into Due Now, Upcoming Today, Completed Today, Missed Today.
   */
  async getToday(organizationId: string, userId: string, userRole?: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const base = this.baseWhere(organizationId, userId, userRole);

    const items = await this.prisma.task.findMany({
      where: {
        ...base,
        dueAt: { gte: todayStart, lte: todayEnd },
      },
      include: this.includeRelations(),
      orderBy: { dueAt: 'asc' },
    });

    const dueNow: any[] = [];
    const upcomingToday: any[] = [];
    const completedToday: any[] = [];
    const missedToday: any[] = [];

    for (const item of items) {
      const enriched = { ...item, computedStatus: this.computeStatus(item) };
      if (enriched.computedStatus === 'COMPLETED') {
        completedToday.push(enriched);
      } else if (enriched.computedStatus === 'OVERDUE' || enriched.computedStatus === 'MISSED') {
        missedToday.push(enriched);
      } else if (enriched.computedStatus === 'DUE') {
        dueNow.push(enriched);
      } else {
        upcomingToday.push(enriched);
      }
    }

    return { dueNow, upcomingToday, completedToday, missedToday, total: items.length };
  }

  /**
   * Get follow-ups for a calendar date range.
   */
  async getCalendar(
    organizationId: string,
    userId: string,
    query: { dateFrom: string; dateTo: string },
    userRole?: string,
  ) {
    const base = this.baseWhere(organizationId, userId, userRole);

    const items = await this.prisma.task.findMany({
      where: {
        ...base,
        dueAt: {
          gte: new Date(query.dateFrom),
          lte: new Date(new Date(query.dateTo).setHours(23, 59, 59, 999)),
        },
      },
      include: this.includeRelations(),
      orderBy: { dueAt: 'asc' },
    });

    return items.map((item) => ({
      ...item,
      computedStatus: this.computeStatus(item),
    }));
  }

  /**
   * Search follow-ups across authorized records.
   */
  async search(organizationId: string, userId: string, searchQuery: string, userRole?: string) {
    if (!searchQuery?.trim()) return [];

    const base = this.baseWhere(organizationId, userId, userRole);
    const items = await this.prisma.task.findMany({
      where: {
        ...base,
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          { purpose: { contains: searchQuery, mode: 'insensitive' } },
          { outcome: { contains: searchQuery, mode: 'insensitive' } },
          { lead: { firstName: { contains: searchQuery, mode: 'insensitive' } } },
          { lead: { lastName: { contains: searchQuery, mode: 'insensitive' } } },
          { lead: { phone: { contains: searchQuery, mode: 'insensitive' } } },
          { lead: { email: { contains: searchQuery, mode: 'insensitive' } } },
        ],
      },
      include: this.includeRelations(),
      orderBy: { dueAt: 'asc' },
      take: 30,
    });

    return items.map((item) => ({
      ...item,
      computedStatus: this.computeStatus(item),
    }));
  }
}
