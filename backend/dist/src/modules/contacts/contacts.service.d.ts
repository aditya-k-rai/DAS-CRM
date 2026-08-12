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
        items: {
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
    }>;
    findOne(organizationId: string, id: string): Promise<{
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
    }>;
    create(organizationId: string, dto: {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        companyId?: string;
        designation?: string;
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
        phone: string | null;
        companyId: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        jobTitle: string | null;
    }>;
    update(organizationId: string, id: string, dto: Partial<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        companyId: string;
        designation: string;
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
        phone: string | null;
        companyId: string | null;
        customFields: import("@prisma/client/runtime/library").JsonValue;
        jobTitle: string | null;
    }>;
    remove(organizationId: string, id: string): Promise<{
        success: boolean;
    }>;
}
