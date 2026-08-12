import { PrismaService } from '../../prisma/prisma.service';
export declare class ActivitiesService {
    private prisma;
    constructor(prisma: PrismaService);
    log(organizationId: string, userId: string, dto: {
        activityType: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'WHATSAPP' | 'SMS' | 'VISIT';
        leadId?: string;
        contactId?: string;
        dealId?: string;
        subject?: string;
        notes: string;
        durationMin?: number;
        outcome?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
        nextAction?: string;
        nextActionDate?: Date;
    }): Promise<{
        id: string;
        createdAt: Date;
        organizationId: string;
        description: string | null;
        type: import("@prisma/client").$Enums.ActivityType;
        userId: string | null;
        companyId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        leadId: string | null;
        contactId: string | null;
        dealId: string | null;
    }>;
    getTimeline(organizationId: string, opts: {
        leadId?: string;
        contactId?: string;
        dealId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        total: number;
        page: number;
        limit: number;
        items: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            organizationId: string;
            description: string | null;
            type: import("@prisma/client").$Enums.ActivityType;
            userId: string | null;
            companyId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue;
            leadId: string | null;
            contactId: string | null;
            dealId: string | null;
        })[];
    }>;
    getUserActivity(organizationId: string, userId: string, days?: number): Promise<{
        activities: {
            id: string;
            createdAt: Date;
            organizationId: string;
            description: string | null;
            type: import("@prisma/client").$Enums.ActivityType;
            userId: string | null;
            companyId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue;
            leadId: string | null;
            contactId: string | null;
            dealId: string | null;
        }[];
        byType: Record<string, number>;
        total: number;
    }>;
}
