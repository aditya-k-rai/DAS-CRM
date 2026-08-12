import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export type TriggerType = 'LEAD_CREATED' | 'LEAD_STATUS_CHANGED' | 'LEAD_SCORE_ABOVE' | 'DEAL_STAGE_CHANGED' | 'TASK_OVERDUE' | 'NO_ACTIVITY';
export type ActionType  = 'SEND_EMAIL' | 'CREATE_TASK' | 'ASSIGN_LEAD' | 'SEND_NOTIFICATION' | 'CHANGE_STATUS' | 'ADD_TAG' | 'WEBHOOK';

@Injectable()
export class AutomationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @InjectQueue('notifications') private queue: Queue,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.automationRule.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, dto: {
    name: string;
    trigger: TriggerType;
    condition?: string;
    actions: ActionType[];
    actionConfig?: Record<string, any>;
  }) {
    return this.prisma.automationRule.create({
      data: {
        organizationId,
        name:         dto.name,
        trigger:      dto.trigger,
        condition:    dto.condition,
        actions:      dto.actions,
        actionConfig: dto.actionConfig ?? {},
        isActive:     true,
        runsCount:    0,
      },
    });
  }

  async toggleActive(organizationId: string, id: string) {
    const rule = await this.prisma.automationRule.findFirst({ where: { id, organizationId } });
    if (!rule) throw new NotFoundException('Automation rule not found');

    return this.prisma.automationRule.update({
      where: { id },
      data: { isActive: !rule.isActive },
    });
  }

  async delete(organizationId: string, id: string) {
    const rule = await this.prisma.automationRule.findFirst({ where: { id, organizationId } });
    if (!rule) throw new NotFoundException('Automation rule not found');

    await this.prisma.automationRule.delete({ where: { id } });
    return { success: true };
  }

  /** Trigger execution engine called by event listeners */
  async handleEvent(organizationId: string, trigger: TriggerType, payload: Record<string, any>) {
    const rules = await this.prisma.automationRule.findMany({
      where: { organizationId, trigger, isActive: true },
    });

    for (const rule of rules) {
      try {
        // Execute actions defined in rule
        for (const action of rule.actions as ActionType[]) {
          await this.executeAction(organizationId, action, rule.actionConfig as Record<string, any>, payload);
        }

        // Update run stats
        await this.prisma.automationRule.update({
          where: { id: rule.id },
          data: {
            runsCount: { increment: 1 },
            lastRunAt: new Date(),
          },
        });
      } catch (err) {
        console.error(`Automation rule ${rule.id} failed:`, err);
      }
    }
  }

  private async executeAction(organizationId: string, action: ActionType, config: Record<string, any>, payload: Record<string, any>) {
    switch (action) {
      case 'SEND_NOTIFICATION':
        if (payload.assigneeId || payload.userId) {
          await this.notificationsService.send({
            organizationId,
            recipientIds: [payload.assigneeId || payload.userId],
            event: 'AUTOMATION_TRIGGERED',
            title: config.title || 'Automation Notification',
            body: config.body || `Triggered by ${payload.name || 'system event'}`,
          });
        }
        break;

      case 'CREATE_TASK':
        if (payload.leadId || payload.id) {
          await this.prisma.task.create({
            data: {
              organizationId,
              title: config.taskTitle || `Follow up with ${payload.name || 'lead'}`,
              leadId: payload.leadId || payload.id,
              assigneeId: payload.assigneeId || payload.ownerId,
              dueDate: new Date(Date.now() + (config.dueDays || 1) * 86400000),
              priority: 'HIGH',
            },
          });
        }
        break;

      case 'WEBHOOK':
        if (config.webhookUrl) {
          await this.queue.add('send-webhook', { url: config.webhookUrl, payload }, { attempts: 3 });
        }
        break;
    }
  }
}
