import { PrismaService } from '../../prisma/prisma.service';
export declare class TasksService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(organizationId: string, userId: string, opts: {
        assignedToMe?: boolean;
        status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
        dueDate?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        total: number;
        page: number;
        limit: number;
        items: ({
            lead: {
                id: string;
                firstName: string;
                lastName: string | null;
            } | null;
            assignee: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            } | null;
        } & {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            createdById: string | null;
            dueAt: Date | null;
            leadId: string | null;
            contactId: string | null;
            dealId: string | null;
            title: string;
            isCompleted: boolean;
            assigneeId: string | null;
            completedAt: Date | null;
        })[];
    }>;
    create(organizationId: string, creatorId: string, dto: {
        title: string;
        description?: string;
        dueDate?: Date;
        priority?: string;
        taskType?: string;
        assigneeId?: string;
        leadId?: string;
        contactId?: string;
        dealId?: string;
    }): Promise<{
        lead: {
            id: string;
            firstName: string;
            lastName: string | null;
        } | null;
        assignee: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string | null;
        dueAt: Date | null;
        leadId: string | null;
        contactId: string | null;
        dealId: string | null;
        title: string;
        isCompleted: boolean;
        assigneeId: string | null;
        completedAt: Date | null;
    }>;
    complete(organizationId: string, id: string, userId: string): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string | null;
        dueAt: Date | null;
        leadId: string | null;
        contactId: string | null;
        dealId: string | null;
        title: string;
        isCompleted: boolean;
        assigneeId: string | null;
        completedAt: Date | null;
    }>;
    update(organizationId: string, id: string, dto: any): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string | null;
        dueAt: Date | null;
        leadId: string | null;
        contactId: string | null;
        dealId: string | null;
        title: string;
        isCompleted: boolean;
        assigneeId: string | null;
        completedAt: Date | null;
    }>;
    delete(organizationId: string, id: string): Promise<{
        success: boolean;
    }>;
    getOverdueCount(organizationId: string): Promise<number>;
    getTodayTasks(organizationId: string, userId: string): Promise<({
        lead: {
            id: string;
            firstName: string;
            lastName: string | null;
        } | null;
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        createdById: string | null;
        dueAt: Date | null;
        leadId: string | null;
        contactId: string | null;
        dealId: string | null;
        title: string;
        isCompleted: boolean;
        assigneeId: string | null;
        completedAt: Date | null;
    })[]>;
}
