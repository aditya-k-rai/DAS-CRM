import { PrismaService } from '../../prisma/prisma.service';
export declare class ContactsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(organizationId: string, opts: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        total: number;
        page: number;
        limit: number;
        items: ({
            company: {
                id: string;
                name: string;
            } | null;
        } & {
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
        })[];
    }>;
    findOne(organizationId: string, id: string): Promise<{
        activities: {
            id: string;
            createdAt: Date;
            organizationId: string;
            type: import("@prisma/client").$Enums.ActivityType;
            description: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue;
            userId: string | null;
            leadId: string | null;
            contactId: string | null;
            companyId: string | null;
            dealId: string | null;
        }[];
        notes: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            organizationId: string;
            leadId: string | null;
            contactId: string | null;
            companyId: string | null;
            dealId: string | null;
            createdById: string | null;
            content: string;
        }[];
        company: {
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
        } | null;
    } & {
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
    }>;
    create(organizationId: string, dto: {
        firstName: string;
        lastName?: string;
        email?: string;
        phone?: string;
        companyId?: string;
        designation?: string;
        jobTitle?: string;
        notes?: string;
        customFields?: Record<string, any>;
    }): Promise<{
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
    }>;
    update(organizationId: string, id: string, dto: Partial<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        companyId: string;
        jobTitle: string;
        notes: string;
        customFields: Record<string, any>;
    }>): Promise<{
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
    }>;
    remove(organizationId: string, id: string): Promise<{
        success: boolean;
    }>;
}
