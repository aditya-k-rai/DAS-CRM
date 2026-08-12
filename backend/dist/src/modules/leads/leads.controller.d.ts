import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
export declare class LeadsController {
    private leadsService;
    constructor(leadsService: LeadsService);
    findAll(user: any, query: LeadQueryDto): Promise<{
        data: ({
            _count: {
                activities: number;
                tasks: number;
            };
            company: {
                id: string;
                name: string;
            } | null;
            status: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                organizationId: string;
                isDefault: boolean;
                isLost: boolean;
                isWon: boolean;
                color: string;
                order: number;
                requiredFields: import("@prisma/client/runtime/library").JsonValue | null;
            } | null;
            owner: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            } | null;
            source: {
                id: string;
                name: string;
                createdAt: Date;
                organizationId: string;
                isActive: boolean;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            organizationId: string;
            email: string | null;
            firstName: string;
            lastName: string | null;
            teamId: string | null;
            tags: string[];
            phone: string | null;
            statusId: string | null;
            ownerId: string | null;
            sourceId: string | null;
            companyId: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            createdById: string | null;
            score: number;
            isConverted: boolean;
            convertedAt: Date | null;
            lastActivityAt: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(user: any, id: string): Promise<{
        deals: ({
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
                color: string;
                order: number;
                pipelineId: string;
                probability: number;
            } | null;
        } & {
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
        })[];
        activities: ({
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
        tasks: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            description: string | null;
            title: string;
            createdById: string | null;
            dueAt: Date | null;
            leadId: string | null;
            contactId: string | null;
            dealId: string | null;
            assigneeId: string | null;
            isCompleted: boolean;
            completedAt: Date | null;
        }[];
        meetings: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            description: string | null;
            title: string;
            startAt: Date;
            leadId: string | null;
            endAt: Date | null;
            location: string | null;
            attendees: import("@prisma/client/runtime/library").JsonValue;
        }[];
        quotations: {
            number: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            currency: string;
            organizationId: string;
            title: string | null;
            status: import("@prisma/client").$Enums.QuotationStatus;
            leadId: string | null;
            dealId: string | null;
            validUntil: Date | null;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            taxTotal: import("@prisma/client/runtime/library").Decimal;
            discountTotal: import("@prisma/client/runtime/library").Decimal;
            grandTotal: import("@prisma/client/runtime/library").Decimal;
            pdfUrl: string | null;
            isLocked: boolean;
            version: number;
        }[];
        team: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            description: string | null;
        } | null;
        company: {
            id: string;
            name: string;
            website: string | null;
            industry: string | null;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            email: string | null;
            phone: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            address: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
        } | null;
        status: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            isDefault: boolean;
            isLost: boolean;
            isWon: boolean;
            color: string;
            order: number;
            requiredFields: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
        owner: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        } | null;
        source: {
            id: string;
            name: string;
            createdAt: Date;
            organizationId: string;
            isActive: boolean;
        } | null;
        noteEntries: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            companyId: string | null;
            createdById: string | null;
            leadId: string | null;
            contactId: string | null;
            dealId: string | null;
            content: string;
        }[];
        statusHistory: ({
            status: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                organizationId: string;
                isDefault: boolean;
                isLost: boolean;
                isWon: boolean;
                color: string;
                order: number;
                requiredFields: import("@prisma/client/runtime/library").JsonValue | null;
            };
        } & {
            id: string;
            notes: string | null;
            statusId: string;
            changedAt: Date;
            leadId: string;
            changedById: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        organizationId: string;
        email: string | null;
        firstName: string;
        lastName: string | null;
        teamId: string | null;
        tags: string[];
        phone: string | null;
        statusId: string | null;
        ownerId: string | null;
        sourceId: string | null;
        companyId: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        createdById: string | null;
        score: number;
        isConverted: boolean;
        convertedAt: Date | null;
        lastActivityAt: Date | null;
    }>;
    create(user: any, dto: CreateLeadDto): Promise<{
        status: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            isDefault: boolean;
            isLost: boolean;
            isWon: boolean;
            color: string;
            order: number;
            requiredFields: import("@prisma/client/runtime/library").JsonValue | null;
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
        notes: string | null;
        organizationId: string;
        email: string | null;
        firstName: string;
        lastName: string | null;
        teamId: string | null;
        tags: string[];
        phone: string | null;
        statusId: string | null;
        ownerId: string | null;
        sourceId: string | null;
        companyId: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        createdById: string | null;
        score: number;
        isConverted: boolean;
        convertedAt: Date | null;
        lastActivityAt: Date | null;
    }>;
    update(user: any, id: string, dto: UpdateLeadDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        organizationId: string;
        email: string | null;
        firstName: string;
        lastName: string | null;
        teamId: string | null;
        tags: string[];
        phone: string | null;
        statusId: string | null;
        ownerId: string | null;
        sourceId: string | null;
        companyId: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        createdById: string | null;
        score: number;
        isConverted: boolean;
        convertedAt: Date | null;
        lastActivityAt: Date | null;
    }>;
    changeStatus(user: any, id: string, statusId: string, notes?: string): Promise<{
        deals: ({
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
                color: string;
                order: number;
                pipelineId: string;
                probability: number;
            } | null;
        } & {
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
        })[];
        activities: ({
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
        tasks: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            description: string | null;
            title: string;
            createdById: string | null;
            dueAt: Date | null;
            leadId: string | null;
            contactId: string | null;
            dealId: string | null;
            assigneeId: string | null;
            isCompleted: boolean;
            completedAt: Date | null;
        }[];
        meetings: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            description: string | null;
            title: string;
            startAt: Date;
            leadId: string | null;
            endAt: Date | null;
            location: string | null;
            attendees: import("@prisma/client/runtime/library").JsonValue;
        }[];
        quotations: {
            number: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            currency: string;
            organizationId: string;
            title: string | null;
            status: import("@prisma/client").$Enums.QuotationStatus;
            leadId: string | null;
            dealId: string | null;
            validUntil: Date | null;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            taxTotal: import("@prisma/client/runtime/library").Decimal;
            discountTotal: import("@prisma/client/runtime/library").Decimal;
            grandTotal: import("@prisma/client/runtime/library").Decimal;
            pdfUrl: string | null;
            isLocked: boolean;
            version: number;
        }[];
        team: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            description: string | null;
        } | null;
        company: {
            id: string;
            name: string;
            website: string | null;
            industry: string | null;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            email: string | null;
            phone: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            address: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
        } | null;
        status: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            isDefault: boolean;
            isLost: boolean;
            isWon: boolean;
            color: string;
            order: number;
            requiredFields: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
        owner: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        } | null;
        source: {
            id: string;
            name: string;
            createdAt: Date;
            organizationId: string;
            isActive: boolean;
        } | null;
        noteEntries: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            companyId: string | null;
            createdById: string | null;
            leadId: string | null;
            contactId: string | null;
            dealId: string | null;
            content: string;
        }[];
        statusHistory: ({
            status: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                organizationId: string;
                isDefault: boolean;
                isLost: boolean;
                isWon: boolean;
                color: string;
                order: number;
                requiredFields: import("@prisma/client/runtime/library").JsonValue | null;
            };
        } & {
            id: string;
            notes: string | null;
            statusId: string;
            changedAt: Date;
            leadId: string;
            changedById: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        organizationId: string;
        email: string | null;
        firstName: string;
        lastName: string | null;
        teamId: string | null;
        tags: string[];
        phone: string | null;
        statusId: string | null;
        ownerId: string | null;
        sourceId: string | null;
        companyId: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        createdById: string | null;
        score: number;
        isConverted: boolean;
        convertedAt: Date | null;
        lastActivityAt: Date | null;
    }>;
    timeline(user: any, id: string): Promise<({
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
    })[]>;
    remove(user: any, id: string): Promise<{
        message: string;
    }>;
}
