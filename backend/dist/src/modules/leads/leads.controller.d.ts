import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
export declare class LeadsController {
    private leadsService;
    constructor(leadsService: LeadsService);
    findAll(user: any, query: LeadQueryDto): Promise<{
        data: ({
            company: {
                id: string;
                name: string;
            } | null;
            _count: {
                activities: number;
                tasks: number;
            };
            status: {
                id: string;
                organizationId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isDefault: boolean;
                color: string;
                order: number;
                isWon: boolean;
                isLost: boolean;
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
                organizationId: string;
                isActive: boolean;
                createdAt: Date;
                name: string;
            } | null;
        } & {
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(user: any, id: string): Promise<{
        team: {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        } | null;
        company: {
            id: string;
            organizationId: string;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            website: string | null;
            industry: string | null;
            phone: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            address: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
        } | null;
        activities: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            } | null;
        } & {
            id: string;
            organizationId: string;
            createdAt: Date;
            userId: string | null;
            description: string | null;
            companyId: string | null;
            type: import("@prisma/client").$Enums.ActivityType;
            metadata: import("@prisma/client/runtime/library").JsonValue;
            leadId: string | null;
            contactId: string | null;
            dealId: string | null;
        })[];
        tasks: {
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
        }[];
        deals: ({
            pipeline: {
                id: string;
                organizationId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isDefault: boolean;
            } | null;
            stage: {
                id: string;
                createdAt: Date;
                name: string;
                color: string;
                order: number;
                pipelineId: string;
                probability: number;
            } | null;
        } & {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string | null;
            companyId: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            status: import("@prisma/client").$Enums.DealStatus;
            leadId: string | null;
            title: string;
            value: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            pipelineId: string | null;
            stageId: string | null;
            expectedCloseAt: Date | null;
            closedAt: Date | null;
        })[];
        meetings: {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            startAt: Date;
            leadId: string | null;
            title: string;
            endAt: Date | null;
            location: string | null;
            attendees: import("@prisma/client/runtime/library").JsonValue;
        }[];
        quotations: {
            number: string;
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            status: import("@prisma/client").$Enums.QuotationStatus;
            leadId: string | null;
            dealId: string | null;
            title: string | null;
            currency: string;
            validUntil: Date | null;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            taxTotal: import("@prisma/client/runtime/library").Decimal;
            discountTotal: import("@prisma/client/runtime/library").Decimal;
            grandTotal: import("@prisma/client/runtime/library").Decimal;
            pdfUrl: string | null;
            isLocked: boolean;
            version: number;
        }[];
        status: {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isDefault: boolean;
            color: string;
            order: number;
            isWon: boolean;
            isLost: boolean;
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
            organizationId: string;
            isActive: boolean;
            createdAt: Date;
            name: string;
        } | null;
        noteEntries: {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            createdById: string | null;
            companyId: string | null;
            leadId: string | null;
            contactId: string | null;
            dealId: string | null;
            content: string;
        }[];
        statusHistory: ({
            status: {
                id: string;
                organizationId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isDefault: boolean;
                color: string;
                order: number;
                isWon: boolean;
                isLost: boolean;
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
    }>;
    create(user: any, dto: CreateLeadDto): Promise<{
        status: {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isDefault: boolean;
            color: string;
            order: number;
            isWon: boolean;
            isLost: boolean;
            requiredFields: import("@prisma/client/runtime/library").JsonValue | null;
        } | null;
        owner: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
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
    }>;
    update(user: any, id: string, dto: UpdateLeadDto): Promise<{
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
    }>;
    changeStatus(user: any, id: string, statusId: string, notes?: string): Promise<{
        team: {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        } | null;
        company: {
            id: string;
            organizationId: string;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            website: string | null;
            industry: string | null;
            phone: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            address: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
        } | null;
        activities: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            } | null;
        } & {
            id: string;
            organizationId: string;
            createdAt: Date;
            userId: string | null;
            description: string | null;
            companyId: string | null;
            type: import("@prisma/client").$Enums.ActivityType;
            metadata: import("@prisma/client/runtime/library").JsonValue;
            leadId: string | null;
            contactId: string | null;
            dealId: string | null;
        })[];
        tasks: {
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
        }[];
        deals: ({
            pipeline: {
                id: string;
                organizationId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isDefault: boolean;
            } | null;
            stage: {
                id: string;
                createdAt: Date;
                name: string;
                color: string;
                order: number;
                pipelineId: string;
                probability: number;
            } | null;
        } & {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string | null;
            companyId: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            status: import("@prisma/client").$Enums.DealStatus;
            leadId: string | null;
            title: string;
            value: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            pipelineId: string | null;
            stageId: string | null;
            expectedCloseAt: Date | null;
            closedAt: Date | null;
        })[];
        meetings: {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            startAt: Date;
            leadId: string | null;
            title: string;
            endAt: Date | null;
            location: string | null;
            attendees: import("@prisma/client/runtime/library").JsonValue;
        }[];
        quotations: {
            number: string;
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            status: import("@prisma/client").$Enums.QuotationStatus;
            leadId: string | null;
            dealId: string | null;
            title: string | null;
            currency: string;
            validUntil: Date | null;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            taxTotal: import("@prisma/client/runtime/library").Decimal;
            discountTotal: import("@prisma/client/runtime/library").Decimal;
            grandTotal: import("@prisma/client/runtime/library").Decimal;
            pdfUrl: string | null;
            isLocked: boolean;
            version: number;
        }[];
        status: {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            isDefault: boolean;
            color: string;
            order: number;
            isWon: boolean;
            isLost: boolean;
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
            organizationId: string;
            isActive: boolean;
            createdAt: Date;
            name: string;
        } | null;
        noteEntries: {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            createdById: string | null;
            companyId: string | null;
            leadId: string | null;
            contactId: string | null;
            dealId: string | null;
            content: string;
        }[];
        statusHistory: ({
            status: {
                id: string;
                organizationId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isDefault: boolean;
                color: string;
                order: number;
                isWon: boolean;
                isLost: boolean;
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
        organizationId: string;
        createdAt: Date;
        userId: string | null;
        description: string | null;
        companyId: string | null;
        type: import("@prisma/client").$Enums.ActivityType;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        leadId: string | null;
        contactId: string | null;
        dealId: string | null;
    })[]>;
    remove(user: any, id: string): Promise<{
        message: string;
    }>;
}
