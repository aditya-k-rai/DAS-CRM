import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export type TriggerType = 'LEAD_CREATED' | 'LEAD_STATUS_CHANGED' | 'DEAL_STAGE_CHANGED' | 'TASK_OVERDUE' | 'SCHEDULED';
export type ActionType = 'SEND_EMAIL' | 'CREATE_TASK' | 'ASSIGN_LEAD' | 'SEND_NOTIFICATION' | 'CHANGE_STATUS' | 'ADD_TAG' | 'WEBHOOK';
export declare class AutomationsService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    findAll(organizationId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isActive: boolean;
        trigger: import("@prisma/client").$Enums.AutomationTrigger;
        conditions: import("@prisma/client/runtime/library").JsonValue;
        actions: import("@prisma/client/runtime/library").JsonValue;
        executionCount: number;
        lastRunAt: Date | null;
    }[]>;
    create(organizationId: string, dto: {
        name: string;
        trigger: TriggerType;
        condition?: string;
        actions: ActionType[];
        actionConfig?: Record<string, any>;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isActive: boolean;
        trigger: import("@prisma/client").$Enums.AutomationTrigger;
        conditions: import("@prisma/client/runtime/library").JsonValue;
        actions: import("@prisma/client/runtime/library").JsonValue;
        executionCount: number;
        lastRunAt: Date | null;
    }>;
    toggleActive(organizationId: string, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isActive: boolean;
        trigger: import("@prisma/client").$Enums.AutomationTrigger;
        conditions: import("@prisma/client/runtime/library").JsonValue;
        actions: import("@prisma/client/runtime/library").JsonValue;
        executionCount: number;
        lastRunAt: Date | null;
    }>;
    delete(organizationId: string, id: string): Promise<{
        success: boolean;
    }>;
    handleEvent(organizationId: string, trigger: TriggerType, payload: Record<string, any>): Promise<void>;
    private executeAction;
}
