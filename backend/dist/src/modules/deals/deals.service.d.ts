import { PrismaService } from '../../prisma/prisma.service';
export declare class DealsService {
    private prisma;
    constructor(prisma: PrismaService);
    getPipelines(organizationId: string): Promise<({
        stages: {
            id: string;
            name: string;
            createdAt: Date;
            order: number;
            probability: number;
            color: string;
            pipelineId: string;
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
        items: ({
            pipeline: {
                id: string;
                name: string;
            } | null;
            stage: {
                id: string;
                name: string;
                probability: number;
            } | null;
            lead: {
                id: string;
                firstName: string;
                lastName: string | null;
            } | null;
            company: {
                id: string;
                name: string;
            } | null;
            owner: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            organizationId: string;
            pipelineId: string | null;
            leadId: string | null;
            companyId: string | null;
            status: import("@prisma/client").$Enums.DealStatus;
            title: string;
            ownerId: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            value: import("@prisma/client/runtime/library").Decimal;
            stageId: string | null;
            expectedCloseAt: Date | null;
            closedAt: Date | null;
        })[];
    }>;
    createDeal(organizationId: string, dto: {
        title: string;
        pipelineId?: string;
        stageId?: string;
        leadId?: string;
        companyId?: string;
        assignedToId?: string;
        ownerId?: string;
        value?: number;
        expectedCloseDate?: Date;
        expectedCloseAt?: Date;
        notes?: string;
    }): Promise<{
        pipeline: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            isDefault: boolean;
        } | null;
        stage: {
            id: string;
            name: string;
            createdAt: Date;
            order: number;
            probability: number;
            color: string;
            pipelineId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        organizationId: string;
        pipelineId: string | null;
        leadId: string | null;
        companyId: string | null;
        status: import("@prisma/client").$Enums.DealStatus;
        title: string;
        ownerId: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        value: import("@prisma/client/runtime/library").Decimal;
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
        pipelineId: string | null;
        leadId: string | null;
        companyId: string | null;
        status: import("@prisma/client").$Enums.DealStatus;
        title: string;
        ownerId: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        value: import("@prisma/client/runtime/library").Decimal;
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
        pipelineId: string | null;
        leadId: string | null;
        companyId: string | null;
        status: import("@prisma/client").$Enums.DealStatus;
        title: string;
        ownerId: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        value: import("@prisma/client/runtime/library").Decimal;
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
