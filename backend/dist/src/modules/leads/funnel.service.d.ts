import { PrismaService } from '../../prisma/prisma.service';
export type FunnelModel = 'CUSTOM_BATCH' | 'DYNAMIC_GRAB' | 'DIRECT_ADMIN';
export declare class LeadFunnelService {
    private prisma;
    constructor(prisma: PrismaService);
    allocateBatchQuota(organizationId: string, managerId: string, startRange: number, endRange: number): Promise<{
        message: string;
        allocatedCount: number;
        leadIds?: undefined;
    } | {
        message: string;
        allocatedCount: number;
        leadIds: string[];
    }>;
    claimDynamicLead(organizationId: string, userId: string, leadId: string): Promise<{
        success: boolean;
        message: string;
        lead: {
            id: string;
            organizationId: string;
            email: string | null;
            firstName: string;
            lastName: string | null;
            teamId: string | null;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            tags: string[];
            statusId: string | null;
            ownerId: string | null;
            sourceId: string | null;
            phone: string | null;
            createdById: string | null;
            companyId: string | null;
            score: number;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            isConverted: boolean;
            convertedAt: Date | null;
            lastActivityAt: Date | null;
        };
    }>;
    directAdminFunnel(organizationId: string, leadIds: string[], managerId: string): Promise<{
        message: string;
        count: number;
    }>;
}
