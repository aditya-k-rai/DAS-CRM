import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Queue } from 'bullmq';
export type TriggerType = 'LEAD_CREATED' | 'LEAD_STATUS_CHANGED' | 'LEAD_SCORE_ABOVE' | 'DEAL_STAGE_CHANGED' | 'TASK_OVERDUE' | 'NO_ACTIVITY';
export type ActionType = 'SEND_EMAIL' | 'CREATE_TASK' | 'ASSIGN_LEAD' | 'SEND_NOTIFICATION' | 'CHANGE_STATUS' | 'ADD_TAG' | 'WEBHOOK';
export declare class AutomationsService {
    private prisma;
    private notificationsService;
    private queue;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, queue: Queue);
    findAll(organizationId: string): Promise<any>;
    create(organizationId: string, dto: {
        name: string;
        trigger: TriggerType;
        condition?: string;
        actions: ActionType[];
        actionConfig?: Record<string, any>;
    }): Promise<any>;
    toggleActive(organizationId: string, id: string): Promise<any>;
    delete(organizationId: string, id: string): Promise<{
        success: boolean;
    }>;
    handleEvent(organizationId: string, trigger: TriggerType, payload: Record<string, any>): Promise<void>;
    private executeAction;
}
