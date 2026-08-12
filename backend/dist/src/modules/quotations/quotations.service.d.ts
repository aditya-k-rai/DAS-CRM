import { PrismaService } from '../../prisma/prisma.service';
export declare class QuotationsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(organizationId: string, opts: {
        status?: any;
        leadId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        total: number;
        page: number;
        limit: number;
        items: ({
            lead: {
                id: string;
                firstName: string;
                lastName: string | null;
            } | null;
        } & {
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
        })[];
    }>;
    findOne(organizationId: string, id: string): Promise<{
        lead: {
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
        } | null;
        items: ({
            product: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                organizationId: string;
                description: string | null;
                isActive: boolean;
                taxRate: import("@prisma/client/runtime/library").Decimal;
                price: import("@prisma/client/runtime/library").Decimal;
                unit: string;
            } | null;
        } & {
            id: string;
            name: string;
            description: string | null;
            order: number;
            total: import("@prisma/client/runtime/library").Decimal;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            productId: string | null;
            quotationId: string;
        })[];
    } & {
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
    }>;
    create(organizationId: string, createdById: string, dto: {
        leadId?: string;
        contactId?: string;
        validUntil?: Date;
        taxRate?: number;
        discountType?: 'FLAT' | 'PERCENT';
        discountValue?: number;
        notes?: string;
        termsAndConditions?: string;
        lineItems: {
            productId?: string;
            name: string;
            description?: string;
            qty: number;
            unitPrice: number;
            taxRate?: number;
        }[];
    }): Promise<{
        items: {
            id: string;
            name: string;
            description: string | null;
            order: number;
            total: import("@prisma/client/runtime/library").Decimal;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            discount: import("@prisma/client/runtime/library").Decimal;
            productId: string | null;
            quotationId: string;
        }[];
    } & {
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
    }>;
    updateStatus(organizationId: string, id: string, status: any): Promise<{
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
    }>;
    delete(organizationId: string, id: string): Promise<{
        success: boolean;
    }>;
}
