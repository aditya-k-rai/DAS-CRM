import { PrismaService } from '../../prisma/prisma.service';
export declare class CompaniesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(organizationId: string, opts: {
        search?: string;
        industry?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        total: number;
        page: number;
        limit: number;
        items: {
            pipelineValue: number;
            leads: {
                id: string;
                status: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    organizationId: string;
                    isDefault: boolean;
                    order: number;
                    color: string;
                    isWon: boolean;
                    isLost: boolean;
                    requiredFields: import("@prisma/client/runtime/library").JsonValue | null;
                } | null;
            }[];
            contacts: {
                id: string;
                firstName: string;
                lastName: string | null;
            }[];
            deals: {
                id: string;
                value: import("@prisma/client/runtime/library").Decimal;
            }[];
            id: string;
            name: string;
            website: string | null;
            industry: string | null;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            email: string | null;
            city: string | null;
            phone: string | null;
            address: string | null;
            state: string | null;
            country: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
        }[];
    }>;
    findOne(organizationId: string, id: string): Promise<{
        leads: {
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
            companyId: string | null;
            createdById: string | null;
            ownerId: string | null;
            phone: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            statusId: string | null;
            sourceId: string | null;
            score: number;
            isConverted: boolean;
            convertedAt: Date | null;
            lastActivityAt: Date | null;
        }[];
        contacts: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            email: string | null;
            firstName: string;
            lastName: string | null;
            companyId: string | null;
            phone: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            jobTitle: string | null;
        }[];
        deals: ({
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
        })[];
    } & {
        id: string;
        name: string;
        website: string | null;
        industry: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        email: string | null;
        city: string | null;
        phone: string | null;
        address: string | null;
        state: string | null;
        country: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
    }>;
    create(organizationId: string, dto: {
        name: string;
        industry?: string;
        city?: string;
        country?: string;
        domain?: string;
        website?: string;
        phone?: string;
        employeeCount?: number;
        notes?: string;
        customFields?: Record<string, any>;
    }): Promise<{
        id: string;
        name: string;
        website: string | null;
        industry: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        email: string | null;
        city: string | null;
        phone: string | null;
        address: string | null;
        state: string | null;
        country: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
    }>;
    update(organizationId: string, id: string, dto: Partial<{
        name: string;
        industry: string;
        city: string;
        country: string;
        domain: string;
        phone: string;
        employeeCount: number;
        notes: string;
        customFields: Record<string, any>;
    }>): Promise<{
        id: string;
        name: string;
        website: string | null;
        industry: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        email: string | null;
        city: string | null;
        phone: string | null;
        address: string | null;
        state: string | null;
        country: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
    }>;
    delete(organizationId: string, id: string): Promise<{
        success: boolean;
    }>;
    getStats(organizationId: string): Promise<{
        total: number;
        withDeals: number;
        industries: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.CompanyGroupByOutputType, "industry"[]> & {
            _count: {
                id: number;
            };
        })[];
    }>;
}
