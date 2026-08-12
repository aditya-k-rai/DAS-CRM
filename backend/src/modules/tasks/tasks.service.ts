import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, userId: string, opts: {
    assignedToMe?: boolean;
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    dueDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { assignedToMe, status, dueDate, page = 1, limit = 30 } = opts;
    const now = new Date();

    const where: any = {
      organizationId,
      ...(assignedToMe && { assigneeId: userId }),
      ...(status === 'OVERDUE'
        ? { completedAt: null, dueDate: { lt: now } }
        : status === 'COMPLETED'
        ? { completedAt: { not: null } }
        : status === 'IN_PROGRESS'
        ? { completedAt: null, startedAt: { not: null } }
        : status === 'PENDING'
        ? { completedAt: null, startedAt: null }
        : {}),
      ...(dueDate && { dueDate: { gte: new Date(dueDate.setHours(0, 0, 0)), lte: new Date(dueDate.setHours(23, 59, 59)) } }),
    };

    const [total, items] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          lead:     { select: { id: true, name: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, items };
  }

  async create(organizationId: string, creatorId: string, dto: {
    title: string;
    description?: string;
    dueDate?: Date;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    taskType?: string;
    assigneeId?: string;
    leadId?: string;
    contactId?: string;
    dealId?: string;
    reminderAt?: Date;
  }) {
    return this.prisma.task.create({
      data: {
        organizationId,
        creatorId,
        title:       dto.title,
        description: dto.description,
        dueDate:     dto.dueDate,
        priority:    dto.priority ?? 'MEDIUM',
        taskType:    dto.taskType ?? 'FOLLOW_UP',
        assigneeId:  dto.assigneeId ?? creatorId,
        leadId:      dto.leadId,
        contactId:   dto.contactId,
        dealId:      dto.dealId,
        reminderAt:  dto.reminderAt,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        lead:     { select: { id: true, name: true } },
      },
    });
  }

  async complete(organizationId: string, id: string, userId: string) {
    const task = await this.prisma.task.findFirst({ where: { id, organizationId } });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.task.update({
      where: { id },
      data: { completedAt: new Date(), completedById: userId },
    });
  }

  async update(organizationId: string, id: string, dto: any) {
    const task = await this.prisma.task.findFirst({ where: { id, organizationId } });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.task.update({ where: { id }, data: dto });
  }

  async delete(organizationId: string, id: string) {
    const task = await this.prisma.task.findFirst({ where: { id, organizationId } });
    if (!task) throw new NotFoundException('Task not found');
    await this.prisma.task.delete({ where: { id } });
    return { success: true };
  }

  async getOverdueCount(organizationId: string) {
    return this.prisma.task.count({
      where: { organizationId, completedAt: null, dueDate: { lt: new Date() } },
    });
  }

  async getTodayTasks(organizationId: string, userId: string) {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end   = new Date(today.setHours(23, 59, 59, 999));
    return this.prisma.task.findMany({
      where: { organizationId, assigneeId: userId, dueDate: { gte: start, lte: end } },
      include: { lead: { select: { id: true, name: true } } },
      orderBy: { priority: 'desc' },
    });
  }
}
