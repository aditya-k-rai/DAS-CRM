import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    userId: string,
    opts: {
      assignedToMe?: boolean;
      status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
      taskType?: string;
      dueDate?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const { assignedToMe, status, taskType, dueDate, page = 1, limit = 30 } = opts;
    const now = new Date();

    const where: any = {
      organizationId,
      AND: [
        {
          OR: [
            { assigneeId: userId },
            { createdById: userId },
          ],
        },
      ],
      ...(taskType && { taskType: taskType.toUpperCase() }),
      ...(status === 'OVERDUE'
        ? { isCompleted: false, dueAt: { lt: now } }
        : status === 'COMPLETED'
          ? { isCompleted: true }
          : status === 'PENDING'
            ? { isCompleted: false }
            : {}),
      ...(dueDate && {
        dueAt: {
          gte: new Date(new Date(dueDate).setHours(0, 0, 0)),
          lte: new Date(new Date(dueDate).setHours(23, 59, 59)),
        },
      }),
    };

    const [total, items] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          lead: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ dueAt: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, page, limit, items };
  }

  async create(
    organizationId: string,
    creatorId: string,
    dto: {
      title: string;
      description?: string;
      dueDate?: Date | string;
      priority?: string;
      taskType?: string;
      followUpType?: string;
      purpose?: string;
      assigneeId?: string;
      leadId?: string;
      contactId?: string;
      dealId?: string;
    },
  ) {
    const taskType = (dto.taskType || 'TODO').toUpperCase();
    const priority = (dto.priority || 'MEDIUM').toUpperCase();
    const dueAt = dto.dueDate ? new Date(dto.dueDate) : undefined;

    return this.prisma.task.create({
      data: {
        organizationId,
        createdById: creatorId,
        title: dto.title,
        description: dto.description,
        dueAt,
        taskType,
        priority,
        followUpType: dto.followUpType,
        purpose: dto.purpose,
        assigneeId: dto.assigneeId ?? creatorId,
        leadId: dto.leadId,
        contactId: dto.contactId,
        dealId: dto.dealId,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async complete(organizationId: string, id: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
    });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.task.update({
      where: { id },
      data: { isCompleted: true, status: 'COMPLETED', completedAt: new Date(), completedById: userId },
    });
  }

  async update(organizationId: string, id: string, dto: any) {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
    });
    if (!task) throw new NotFoundException('Task not found');
    return this.prisma.task.update({ where: { id }, data: dto });
  }

  async delete(organizationId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.prisma.task.delete({ where: { id } });
    return { success: true };
  }

  async getOverdueCount(organizationId: string) {
    return this.prisma.task.count({
      where: { organizationId, isCompleted: false, dueAt: { lt: new Date() } },
    });
  }

  async getTodayTasks(organizationId: string, userId: string) {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));
    return this.prisma.task.findMany({
      where: {
        organizationId,
        assigneeId: userId,
        dueAt: { gte: start, lte: end },
      },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { dueAt: 'asc' },
    });
  }
}
