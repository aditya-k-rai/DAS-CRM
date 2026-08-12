import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AutomationTrigger } from '@prisma/client';

export type TriggerType =
  | 'LEAD_CREATED'
  | 'LEAD_STATUS_CHANGED'
  | 'DEAL_STAGE_CHANGED'
  | 'TASK_OVERDUE'
  | 'SCHEDULED';
export type ActionType =
  | 'SEND_EMAIL'
  | 'CREATE_TASK'
  | 'ASSIGN_LEAD'
  | 'SEND_NOTIFICATION'
  | 'CHANGE_STATUS'
  | 'ADD_TAG'
  | 'WEBHOOK';

@Injectable()
export class AutomationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.automation.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    organizationId: string,
    dto: {
      name: string;
      trigger: TriggerType;
      condition?: string;
      actions: ActionType[];
      actionConfig?: Record<string, any>;
    },
  ) {
    return this.prisma.automation.create({
      data: {
        organizationId,
        name: dto.name,
        trigger: dto.trigger,
        conditions: dto.condition ? [dto.condition] : [],
        actions: dto.actions.map((a) => ({
          type: a,
          config: dto.actionConfig ?? {},
        })),
        isActive: true,
        executionCount: 0,
      },
    });
  }

  async toggleActive(organizationId: string, id: string) {
    const rule = await this.prisma.automation.findFirst({
      where: { id, organizationId },
    });
    if (!rule) throw new NotFoundException('Automation rule not found');

    return this.prisma.automation.update({
      where: { id },
      data: { isActive: !rule.isActive },
    });
  }

  async delete(organizationId: string, id: string) {
    const rule = await this.prisma.automation.findFirst({
      where: { id, organizationId },
    });
    if (!rule) throw new NotFoundException('Automation rule not found');

    await this.prisma.automation.delete({ where: { id } });
    return { success: true };
  }

  /** Trigger execution engine called by event listeners */
  async handleEvent(
    organizationId: string,
    trigger: TriggerType,
    payload: Record<string, any>,
  ) {
    const rules = await this.prisma.automation.findMany({
      where: {
        organizationId,
        trigger: trigger,
        isActive: true,
      },
    });

    for (const rule of rules) {
      try {
        const actionsList = (rule.actions as any[]) ?? [];

        // Execute actions defined in rule
        for (const act of actionsList) {
          const actionType = typeof act === 'string' ? act : act.type;
          const actionConfig =
            typeof act === 'object' && act.config ? act.config : {};
          await this.executeAction(
            organizationId,
            actionType,
            actionConfig,
            payload,
          );
        }

        // Update run stats
        await this.prisma.automation.update({
          where: { id: rule.id },
          data: {
            executionCount: { increment: 1 },
            lastRunAt: new Date(),
          },
        });
      } catch (err) {
        console.error(`Automation rule ${rule.id} failed:`, err);
      }
    }
  }

  private async executeAction(
    organizationId: string,
    action: ActionType,
    config: Record<string, any>,
    payload: Record<string, any>,
  ) {
    switch (action) {
      case 'SEND_NOTIFICATION':
        if (payload.assigneeId || payload.userId) {
          await this.notificationsService.send({
            organizationId,
            recipientIds: [payload.assigneeId || payload.userId],
            event: 'AUTOMATION_TRIGGERED',
            title: config.title || 'Automation Notification',
            body:
              config.body || `Triggered by ${payload.name || 'system event'}`,
          });
        }
        break;

      case 'CREATE_TASK':
        if (payload.leadId || payload.id) {
          await this.prisma.task.create({
            data: {
              organizationId,
              title:
                config.taskTitle || `Follow up with ${payload.name || 'lead'}`,
              leadId: payload.leadId || payload.id,
              assigneeId: payload.assigneeId || payload.ownerId,
              dueAt: new Date(Date.now() + (config.dueDays || 1) * 86400000),
            },
          });
        }
        break;

      case 'WEBHOOK':
        if (config.webhookUrl) {
          try {
            await fetch(config.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
          } catch (e) {
            console.error('Webhook dispatch failed:', e);
          }
        }
        break;
    }
  }
}
