import { PrismaService } from '../../prisma/prisma.service';
export declare class DealsService {
    private prisma;
    constructor(prisma: PrismaService);
    getPipelines(organizationId: string): Promise<({
        stages: {
            id: string;
            name: string;
            createdAt: Date;
            color: string;
            order: number;
            pipelineId: string;
            probability: number;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        isDefault: boolean;
    })[]>;
    getDeals(organizationId: string, opts: {
        pipelineId?: string;
        stageId?: string;
        assignedTo?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        total: number;
        page: number;
        limit: number;
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            organizationId: string;
            title: string;
            ownerId: string | null;
            companyId: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            status: import("@prisma/client").$Enums.DealStatus;
            leadId: string | null;
            value: import("@prisma/client/runtime/library").Decimal;
            pipelineId: string | null;
            stageId: string | null;
            expectedCloseAt: Date | null;
            closedAt: Date | null;
        }[];
    }>;
    createDeal(organizationId: string, dto: {
        title: string;
        pipelineId: string;
        stageId: string;
        contactId?: string;
        assignedToId?: string;
        value?: number;
        expectedCloseDate?: Date;
        probability?: number;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        organizationId: string;
        title: string;
        ownerId: string | null;
        companyId: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        status: import("@prisma/client").$Enums.DealStatus;
        leadId: string | null;
        value: import("@prisma/client/runtime/library").Decimal;
        pipelineId: string | null;
        stageId: string | null;
        expectedCloseAt: Date | null;
        closedAt: Date | null;
    }>;
    moveDeal(organizationId: string, dealId: string, stageId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        organizationId: string;
        title: string;
        ownerId: string | null;
        companyId: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        status: import("@prisma/client").$Enums.DealStatus;
        leadId: string | null;
        value: import("@prisma/client/runtime/library").Decimal;
        pipelineId: string | null;
        stageId: string | null;
        expectedCloseAt: Date | null;
        closedAt: Date | null;
    }>;
    updateDeal(organizationId: string, id: string, dto: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        organizationId: string;
        title: string;
        ownerId: string | null;
        companyId: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        status: import("@prisma/client").$Enums.DealStatus;
        leadId: string | null;
        value: import("@prisma/client/runtime/library").Decimal;
        pipelineId: string | null;
        stageId: string | null;
        expectedCloseAt: Date | null;
        closedAt: Date | null;
    }>;
    deleteDeal(organizationId: string, id: string): Promise<{
        success: boolean;
    }>;
    getForecast(organizationId: string): Promise<{
        totalPipeline: number;
        weightedValue: number;
        byStage: Record<string, any>;
        dealsCount: number;
    }>;
}
