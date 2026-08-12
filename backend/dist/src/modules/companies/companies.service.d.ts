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
                    isLost: boolean;
                    isWon: boolean;
                    color: string;
                    order: number;
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
            phone: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            address: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
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
        }[];
        contacts: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            email: string | null;
            firstName: string;
            lastName: string | null;
            phone: string | null;
            companyId: string | null;
            customFields: import("@prisma/client/runtime/library").JsonValue;
            jobTitle: string | null;
        }[];
        deals: ({
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
    } & {
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
    }>;
    create(organizationId: string, dto: {
        name: string;
        industry?: string;
        city?: string;
        country?: string;
        domain?: string;
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
        phone: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
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
        phone: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
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
